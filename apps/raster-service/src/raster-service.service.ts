import { Injectable } from '@nestjs/common';

@Injectable()
export class RasterServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
