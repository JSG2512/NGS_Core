import { Controller } from '@nestjs/common';
import { KafkaMessageHandler } from 'src/global/kafka/kafka-message-handler.decorator';
import { WebRtcService } from './webrtc.service';

@Controller('webrtc')
export class WebRtcController {
  constructor(private readonly webRtcService: WebRtcService) {}

  @KafkaMessageHandler('get-webrtc-offer')
  getWebRtcOffer(payload: object) {
    return this.webRtcService.getWebRtcOffer(payload);
  }

  @KafkaMessageHandler('get-video-offer')
  getVideoOffer(payload: object) {
    return this.webRtcService.getVideoOffer(payload);
  }

  @KafkaMessageHandler('get-audio-offer')
  getAudioOffer(payload: object) {
    return this.webRtcService.getAudioOffer(payload);
  }

  @KafkaMessageHandler('check-current-connection')
  checkCurrentConnection(payload: object) {
    return this.webRtcService.checkCurrentConnection(payload);
  }
}
