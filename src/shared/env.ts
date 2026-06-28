

export const env = (key:string, defaultValue?:string) => {
    return import.meta.env[key] || defaultValue

}