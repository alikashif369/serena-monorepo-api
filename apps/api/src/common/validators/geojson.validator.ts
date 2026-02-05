import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Geometry } from 'geojson';

/**
 * Custom validator to validate GeoJSON geometry structure and coordinate bounds
 */
@ValidatorConstraint({ async: false })
export class IsValidGeoJSONConstraint implements ValidatorConstraintInterface {
  validate(geometry: any, _args: ValidationArguments) {
    if (!geometry || typeof geometry !== 'object') {
      return false;
    }

    // Check if geometry has required fields
    if (!geometry.type || !geometry.coordinates) {
      return false;
    }

    // Validate geometry type
    const validTypes = [
      'Point',
      'MultiPoint',
      'LineString',
      'MultiLineString',
      'Polygon',
      'MultiPolygon',
      'GeometryCollection',
    ];

    if (!validTypes.includes(geometry.type)) {
      return false;
    }

    // Validate coordinates structure and bounds
    try {
      if (geometry.type === 'GeometryCollection') {
        // GeometryCollection has 'geometries' instead of 'coordinates'
        if (!Array.isArray(geometry.geometries)) {
          return false;
        }
        // Recursively validate each geometry
        for (const geom of geometry.geometries) {
          if (!this.validate(geom, _args)) {
            return false;
          }
        }
        return true;
      }

      // Validate coordinates
      if (!Array.isArray(geometry.coordinates)) {
        return false;
      }

      // Validate coordinate bounds recursively
      return this.validateCoordinates(geometry.coordinates, geometry.type);
    } catch (error) {
      return false;
    }
  }

  /**
   * Recursively validate coordinates and check bounds
   */
  private validateCoordinates(coords: any, geometryType: string): boolean {
    if (!Array.isArray(coords)) {
      return false;
    }

    // Check if this is a coordinate pair [lon, lat]
    if (
      coords.length >= 2 &&
      typeof coords[0] === 'number' &&
      typeof coords[1] === 'number'
    ) {
      const [lon, lat] = coords;

      // Validate longitude: -180 to 180
      if (lon < -180 || lon > 180) {
        return false;
      }

      // Validate latitude: -90 to 90
      if (lat < -90 || lat > 90) {
        return false;
      }

      // Optional third coordinate (elevation/altitude) - no bounds check
      if (coords.length > 2 && typeof coords[2] !== 'number') {
        return false;
      }

      return true;
    }

    // Recursively validate nested arrays
    for (const coord of coords) {
      if (!this.validateCoordinates(coord, geometryType)) {
        return false;
      }
    }

    // Additional validation for Polygon: first and last coordinates must be the same
    if (geometryType === 'Polygon' && coords.length > 0) {
      for (const ring of coords) {
        if (Array.isArray(ring) && ring.length > 0) {
          const first = ring[0];
          const last = ring[ring.length - 1];

          // Check if first and last coordinate are the same
          if (
            Array.isArray(first) &&
            Array.isArray(last) &&
            (first[0] !== last[0] || first[1] !== last[1])
          ) {
            return false;
          }
        }
      }
    }

    return true;
  }

  defaultMessage(_args: ValidationArguments) {
    return 'Invalid GeoJSON geometry. Must be a valid GeoJSON geometry object with coordinates within valid bounds (longitude: -180 to 180, latitude: -90 to 90)';
  }
}

/**
 * Decorator to validate GeoJSON geometry
 *
 * Usage:
 * @IsValidGeoJSON()
 * geometry: any;
 */
export function IsValidGeoJSON(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidGeoJSONConstraint,
    });
  };
}
