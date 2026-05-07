import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

/** Global singleton – inject RedisService anywhere without re-importing. */
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
