const mongoose = require("mongoose")
const plm = require("passport-local-mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/insta");

const userSchema = mongoose.Schema({
username: String,
name: String,
email: String,
password: String,
profileImage: String,
bio: String,
posts: [{type: mongoose.Schema.Types.ObjectId, ref: "post" }],//post id hogi..

stories: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "story" 
    }
  ],
  notifications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Notification"
}],

  saved: [{ type: mongoose.Schema.Types.ObjectId, ref: "post" }],

  followers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user" 
    } 
  ],
  following: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user" 
    }
  ],
});

userSchema.plugin(plm) // userSchema.plugin(plm); ka matlab hai ki passport-local-mongoose plugin ko userSchema par apply kar rahe hain. Isse userSchema me kuch additional functionality add ho jati hai jo Passport.js ke sath user authentication ko simplify karta hai.
// assport-local-mongoose plugin ke dwara, user authentication ke liye zaruri functions jaise serializeUser aur deserializeUser user schema me automatically add ho jate hain

module.exports = mongoose.model("user", userSchema); // iske throw CRUD operation krva payege.
