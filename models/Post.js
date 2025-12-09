const mongoose = require ('mongoose');

const PostSchema = new mongoose.Schema({
    description: {
        type: String,
        required: [true, 'El post debe tener contenido.'],
        trim: true,
        maxlength: 500 // Límite de caracteres para un post
    },
    media_url: {
        type: String,
        trim: true,
        default: null
    },

    author: {
        _id: {
            type: mongoose.Schema.ObjectId, 
            ref: 'User', 
            required: true
        },
        user_name: { type: String, required: true },
        photo_profile: { type: String }
    },


    //Inscrustaciones
    is_repost_of: {
        type: mongoose.Schema.ObjectId, // ID del post original si este es un repost
        ref: 'Post',
        default: null
    },

    //Desnormalización de Tags y Usuarios Etiquetados
    tags: [{
        type: String,
        lowercase: true,
        trim: true
    }],
    users_tagged_ids: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }],

   //Contadores Embebidos
    counters: {
        likes: {
            type: Number,
            default: 0
        },
        comments: {
            type: Number,
            default: 0
        },
        reposts: {
            type: Number,
            default: 0
        },
        favorites: {
            type: Number,
            default: 0
        }
    },

    created_at: {
        type: Date,
        default: Date.now,
        index: true
    },
    updated_at: {
        type: Date,
        default: Date.now
    },
    deleted_at: {
        type: Date,
        default: null,
        index: true
    }
}, { collection: 'post' });

module.exports = mongoose.model('Post', PostSchema);