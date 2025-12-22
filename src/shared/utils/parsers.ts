export const decodeJSONStr = (data: string) => JSON.parse(data);
export const encodeJSONStr = (data: object) => JSON.stringify(data);
export const parseJSON = (data: any) => JSON.parse(JSON.stringify(data));
