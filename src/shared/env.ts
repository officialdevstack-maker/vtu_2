

export const env = (key:string, defaultValue:string) => {
    return process.env[key] || defaultValue

}