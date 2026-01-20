
// mock-api.ts
export class MockRequest {
    body: any;
    constructor(body: any) {
        this.body = body;
    }
    async json() {
        return this.body;
    }
}

export class MockNextResponse {
    static json(data: any, options?: any) {
        return { 
            jsonData: data, 
            status: options?.status || 200 
        };
    }
}
