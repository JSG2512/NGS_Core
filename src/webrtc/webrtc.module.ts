import { Module } from '@nestjs/common';
import { WebRtcController } from './webrtc.controler';
import { WebRtcService } from './webrtc.service';

@Module({
  imports: [],
  controllers: [WebRtcController],
  providers: [WebRtcService],
})
export class WebRtcModule {}
