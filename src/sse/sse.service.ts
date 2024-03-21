import { Injectable } from '@nestjs/common';

@Injectable()
export class SSEService {
  private clients: any[] = [];

  addClient(client: any) {
    this.clients.push(client);
  }

  removeClient(client: any) {
    this.clients = this.clients.filter((c) => c !== client);
  }

  sendEventToAllClients(event: string, data: any) {
    this.clients.forEach((client) => {
      client.sendEvent(event, data);
    });
  }
}
