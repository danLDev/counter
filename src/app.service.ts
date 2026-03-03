import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getCounter() {
    return 'hello'
  }
}
