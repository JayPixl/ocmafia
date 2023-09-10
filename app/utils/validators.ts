export const validateEmail = (email: string): string | undefined => {
    var validRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    if (!email.length || !validRegex.test(email)) {
        return "Please enter a valid email address"
    }
}

export const validatePassword = (password: string): string | undefined => {
    if (password.length < 8) return "Please enter a password that is at least 8 characters long"
    if (password.length > 20) return "Password cannot be more than 20 characters long"
}

export const validateUsername = (name: string): string | undefined => {
    var usernameRegex = /^[a-zA-Z0-9]+$/;
    if (name.length < 5) return `Username must be at least 5 characters long`
    if (name.length > 15) return `Username cannot be more than 15 characters long`
    if (!usernameRegex.test(name)) return `Username can only contain alphanumeric characters`
}

export const validateLength = (string: string, maxLength: number, minLength?: number): string | undefined => {
    return (
        (minLength && string.length < minLength ? `Must be at least ${minLength} character${minLength !== 1 ? 's' : ''} long` : undefined) ||
        (string.length > maxLength ? `Cannot be more than ${maxLength} characters long` : undefined)
    )
}

export const validateStat: (stat?: number) => string | undefined = (stat) => {
    if (typeof stat !== 'number') return "Invalid input type"
    if (stat % 1 !== 0) return "Must be a whole number"
    if (stat < 1 || stat > 10) return "Must be between 1 and 10"
}

export const validateURL: (string: string) => string | undefined = (string) => {
    try {
        const url = new URL(string)
    } catch (e) {
        return "Not a valid URL"
    }
}