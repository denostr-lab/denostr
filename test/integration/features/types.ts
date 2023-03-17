export type RegexFunc = {
    reg: RegExp
    func: Function
}
export interface WorldType {
    parameters: Record<string, any>
    functions: Record<string, RegexFunc[]>
}