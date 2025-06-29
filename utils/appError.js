// Inheriting from the parent class Error
class AppError extends Error{
    // Object will take the message and the statuscode
    constructor(message, statusCode){
        // call parent constructor using super
        // message is the parameter built-in-error accepts
        super(message) 

        this.statusCode = statusCode
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
        this.isOperational = true

        Error.captureStackTrace(this, this.constructor)
    }
}
module.exports = AppError