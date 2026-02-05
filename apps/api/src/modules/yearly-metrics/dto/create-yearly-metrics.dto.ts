import { IsInt, IsNumber, IsOptional, Min, Max, registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Custom validator to ensure percentage sum doesn't exceed 100%
function ValidatePercentageSum(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'validatePercentageSum',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(_value: any, args: ValidationArguments) {
          const obj = args.object as CreateYearlyMetricsDto;

          // Sum all percentage fields (only non-null values)
          const sum = (obj.treeCanopy ?? 0) +
                      (obj.greenArea ?? 0) +
                      (obj.barrenLand ?? 0) +
                      (obj.wetLand ?? 0) +
                      (obj.snow ?? 0) +
                      (obj.rock ?? 0) +
                      (obj.water ?? 0) +
                      (obj.buildup ?? 0) +
                      (obj.solarPanels ?? 0);

          return sum <= 100;
        },
        defaultMessage(args: ValidationArguments) {
          const obj = args.object as CreateYearlyMetricsDto;
          const sum = (obj.treeCanopy ?? 0) +
                      (obj.greenArea ?? 0) +
                      (obj.barrenLand ?? 0) +
                      (obj.wetLand ?? 0) +
                      (obj.snow ?? 0) +
                      (obj.rock ?? 0) +
                      (obj.water ?? 0) +
                      (obj.buildup ?? 0) +
                      (obj.solarPanels ?? 0);

          return `Total land cover percentages cannot exceed 100% (current total: ${sum.toFixed(2)}%)`;
        },
      },
    });
  };
}

export class CreateYearlyMetricsDto {
  @ApiProperty({ description: 'Site ID for these metrics', example: 1 })
  @IsInt()
  @ValidatePercentageSum()
  siteId: number;

  @ApiProperty({ description: 'Year of the metrics', example: 2023 })
  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;

  // Land cover percentages
  @ApiPropertyOptional({ description: 'Tree canopy coverage percentage', example: 25.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  treeCanopy?: number;

  @ApiPropertyOptional({ description: 'Green area coverage percentage', example: 30.2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  greenArea?: number;

  @ApiPropertyOptional({ description: 'Barren land coverage percentage', example: 15.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  barrenLand?: number;

  @ApiPropertyOptional({ description: 'Wetland coverage percentage', example: 5.3 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  wetLand?: number;

  @ApiPropertyOptional({ description: 'Snow coverage percentage', example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  snow?: number;

  @ApiPropertyOptional({ description: 'Rock coverage percentage', example: 10.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  rock?: number;

  @ApiPropertyOptional({ description: 'Water coverage percentage', example: 2.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  water?: number;

  @ApiPropertyOptional({ description: 'Buildup coverage percentage', example: 12.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  buildup?: number;

  @ApiPropertyOptional({ description: 'Solar panels coverage percentage', example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  solarPanels?: number;

  // Raster references
  @ApiPropertyOptional({ description: 'Base raster ID (satellite imagery)', example: 5 })
  @IsOptional()
  @IsInt()
  baseRasterId?: number;

  @ApiPropertyOptional({ description: 'Classified raster ID (land cover classification)', example: 6 })
  @IsOptional()
  @IsInt()
  classifiedRasterId?: number;
}
