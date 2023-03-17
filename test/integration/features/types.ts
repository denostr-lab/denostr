export type RegexFunc = {
    reg: RegExp
    func: ()=> void
}
export interface IWorld {
    parameters: Record<string, any>
    functions: Record<string, RegexFunc[]>
}
export interface IWebSocketWrapper {
    send: (data: string | ArrayBufferLike | Blob | ArrayBufferView)=> void
    close: ()=> void
    
}