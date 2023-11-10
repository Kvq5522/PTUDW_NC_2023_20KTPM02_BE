import { AppService } from './app.service';
export declare class AppController {
    private appService;
    constructor(appService: AppService);
    getMain(): {
        statusCode: number;
        message: string;
        metadata: {
            version: string;
            author_1: string;
            author_2: string;
            class: string;
        };
    };
}
