// utils/multerUtil.js

const multer = require('multer')
const AppError = require('./appError') // Adjust path as needed

/**
 * Returns a configured multer instance.
 * @param {Object} options - Custom options
 * @param {String} options.destination - Folder path to save files
 * @param {String} options.prefix - Filename prefix
 * @param {String[]} options.allowedTypes - Array of allowed mimetypes, e.g. ['image']
 */
const createMulter = ({ destination, prefix = '', allowedTypes = ['image'] }) => {
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, destination)
        },
        filename: (req, file, cb) => {
            let ext = file.mimetype.split('/')[1]
            let userId = ''
            try {
                // Fallback if you have token in cookies
                if (req.cookies && req.cookies.token) {
                    let obj = JSON.parse(req.cookies.token)
                    userId = obj['_id']
                }
            } catch (e) {}
            cb(null, `${prefix}${userId ? userId + '-' : ''}${Date.now()}.${ext}`)
        }
    })

    const fileFilter = (req, file, cb) => {
        if (allowedTypes.some(type => file.mimetype.startsWith(type))) {
            cb(null, true)
        } else {
            cb(new AppError(`Not a valid file type! Allowed: ${allowedTypes.join(', ')}`, 400), false)
        }
    }

    return multer({
        storage: storage,
        fileFilter: fileFilter
    })
}

module.exports = createMulter