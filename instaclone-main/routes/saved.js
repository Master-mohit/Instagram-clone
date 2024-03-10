const mongoose = require("mongoose");
const saveSchema = mongoose.Schema({
    post: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "post" 
        }
      ],

})

module.exports = mongoose.model("save", saveSchema);