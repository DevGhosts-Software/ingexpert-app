import { Module } from '@nestjs/common';
import { TrpcModule } from '../trpc/trpc.module';
import { ProjectsService } from './projects.service';
import { ProjectsRouter } from './projects.router';

@Module({
  imports: [TrpcModule],
  providers: [ProjectsService, ProjectsRouter],
  exports: [ProjectsRouter],
})
export class ProjectsModule {}
