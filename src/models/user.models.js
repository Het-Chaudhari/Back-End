import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userschema= new Schema({
    username:{
        type:String,
        required : true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true // this is used for serching
    },
    email:{
        type:String,
        required : true,
        unique:true,
        lowercase:true,
        trim:true,
    },
    fullname:{
        type:String,
        required : true,
        lowercase:true,
        trim:true,
    },
    avatar:{
        type:String,// cloudinary url
        required:true,
    },
    coverImage:{
        type:String,
    },
    watchhistory:[
       {
        type:Schema.Types.ObjectId,
        ref:"Vedio",
       }

    ],
    password: {
        type: String,
        required: [true, 'Password is required']
    },
    refreshToken: {
        type: String
    }

},{timestamps:true})

userschema.pre("save", async function(next){
// ama em hoy ke jo jara bhi change upar vara schema ma ave to aa code run thay 
// to apde em code appishu ke jo password change thayo hoy to j aa code run thay 

    if(!this.isModified("password")){
        return next();
    }

    this.password = await bcrypt.hash(this.password,10)
    next()
})

userschema.methods.isPasswordCorrect=async function (password) {
    return await bcrypt.compare(password,this.password);
}

userschema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userschema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userschema)