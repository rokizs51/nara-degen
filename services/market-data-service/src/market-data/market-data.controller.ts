import { Controller, Get } from '@nestjs/common'
import { MarketDataService } from './market-data.service'

@Controller()
export class MarketDataController {
  constructor(private readonly service: MarketDataService) {}

  @Get('market-data')
  async getMarketData() {
    return this.service.fetchStocksWithMarketData()
  }

  @Get('health')
  health() {
    return { ok: true }
  }
}
