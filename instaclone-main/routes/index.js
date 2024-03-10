var express = require('express');
var router = express.Router();
const usermodel = require("./users");
const postmodel = require("./post");
const commentmodel = require("./comments")
const savemodel = require("./saved");
const passport = require('passport');
const localStrategy = require("passport-local");// allow  krta h ki username or pass. ke basic me account bna ske 
const upload = require("./multer");
const socketIo = require('socket.io');





passport.use(new localStrategy(usermodel.authenticate())) //user ko login rakhe rhe ho.

router.get('/', function(req, res) {
  res.render('index', {footer: false});
});

router.get('/login', function(req, res) {
  res.render('login', {footer: false});
});

router.get('/feed', isLoggedIn, async function(req, res) {
  try {
    const posts = await postmodel.find().populate("user");
    const user = await usermodel.findOne({ username: req.session.passport.user });
    res.render('feed', { footer: true, posts, user });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send('Internal Server Error');
  }
});


// /profile Route
router.get('/profile', isLoggedIn, async function(req, res) {
  const user = await usermodel.findOne({ username: req.session.passport.user }).populate("posts");
  res.render('profile', {footer: true, user});
});

router.get('/comments', isLoggedIn, async function(req, res) {
  try {
    const user = await usermodel.findOne({ username: req.session.passport.user });
    const profileImage = user.profileImage; 
    res.render('comments', { footer: true, user, profileImage }); 
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send('Internal Server Error');
  }
});




router.get('/saved', isLoggedIn, async function(req, res) {
  try {
    // Fetch the saved posts for the current user
    const user = await usermodel.findOne({ username: req.session.passport.user }).populate("saved");
    const savedPosts = user.saved; // Extract the saved posts from the user object

    console.log("Saved posts:", savedPosts); // Add this line to check the savedPosts variable

    // Render the 'saved' template and pass the savedPosts array to it
    res.render('saved', { footer: true, savedPosts });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send('Internal Server Error');
  }
});

// /profile/:user Route
router.get('/profile/:user', isLoggedIn, async function(req, res) {
  const user = await usermodel.findOne({ username: req.params.user }).populate("posts");
  const loggedInUser = await usermodel.findOne({ username: req.session.passport.user });
  
  if (!user) {
    return res.redirect('/profile'); // Redirect to logged in user's profile if user not found
  }

  res.render('userprofile', { footer: true, userprofile: user, user: loggedInUser });
});


router.get('/follow/:userid',isLoggedIn, async function(req, res) {
  let followkarnevala = await usermodel.findOne({ username: req.session.passport.user });
  let followhonevala = await usermodel.findOne({_id: req.params.userid});
 
  if(followkarnevala.following.indexOf(followhonevala._id) != -1){
   const index =  followkarnevala.following.indexOf(followhonevala._id)
     followkarnevala.following.splice(index, 1)

     const index1 =  followhonevala.followers.indexOf(followkarnevala._id)
     followhonevala.followers.splice(index1, 1)
  }
  else {
    followkarnevala.following.push(followhonevala._id);
    followhonevala.followers.push(followkarnevala._id);
  }

   await followhonevala.save();
   await followkarnevala.save();

   res.redirect("back")


});

router.get('/search',isLoggedIn, async function(req, res) {
  const user = await usermodel.findOne({ username: req.session.passport.user }).populate("posts")
  res.render('search', {footer: true, user});
});



router.get('/edit', isLoggedIn, async function(req, res) {
  const user = await usermodel.findOne({ username: req.session.passport.user });//ek bar data fill kre to vo dikhna chaiye
  res.render('edit', {footer: true, user});
});

router.get('/upload',isLoggedIn, async function(req, res) {
  const user = await usermodel.findOne({ username: req.session.passport.user });
  res.render('upload', {footer: true, user});
});

router.get('/username/:username', isLoggedIn, async function(req, res) {
  const regex = new RegExp(`${req.params.username}`, 'i')
 const users = await usermodel.find({username: regex})
 res.json(users);
});

router.get("/like/post/:id",isLoggedIn,async function(req, res) {
  const user = await usermodel.findOne({ username: req.session.passport.user });//login user mil gya user ke under..
  const post = await postmodel.findOne({_id: req.params.id});//id find krna jis post me like kr rha h

  //agr like h to remove like 
  //agr ni h like to like it.
  if (post.likes.indexOf(user._id) === -1){ //likes array me user ki id ko dhud rhe h agr khali h to like kro.
    post.likes.push(user._id);

  }
  else {
    post.likes.splice(post.likes.indexOf(user._id), 1);//index nikal kr dega or kitne like hatana h..
  }
  await post.save(); //push and splice dono hath se kiye h to save krna pdega..
  res.redirect("/feed")
});


router.post("/register", function(req, res, next){
const userData = new usermodel({
  username: req.body.username,
  name: req.body.name,
  email: req.body.email
  
})

usermodel.register(userData, req.body.password) //promiss return krta h ..
.then(function(){
  passport.authenticate("local")(req, res, function(){ //process of login
 res.redirect("/profile")
})
}); //account bn gya h...
});
//  passport.authenticate("local") ka matlab hai ki aap Passport.js middleware ka use
//   karke local authentication strategy ko implement kar rahe hain.
// Yahan, "local" term ek authentication strategy ko refer karta hai jo user ke credentials
//  (jaise ki username aur password) ka use karta hai. 
// Ye strategy local database ya kisi aur storage system mein stored credentials ko verify karta hai.
  

router.post('/login', passport.authenticate("local", {//username or pass. ke baisc me login kroo..
 successRedirect: "/profile", //agr si data ho to use profile route me bhej dena.
 failureRedirect: "/login"
}), function(req, res) {
  res.render('upload', {footer: true});
});

router.get('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

router.post("/update",upload.single("image"), async function(req, res){ //image upload hui isse
const user = await usermodel.findOneAndUpdate({username: req.session.passport.user},
   {username: req.body.username, name: req.body.name, bio: req.body.bio},
    {new: true} //username and name and bio update hua..
    );

    if(req.file){
      user.profileImage = req.file.filename;//image upload huii
    }
   await user.save(); 
   res.redirect("/profile")
});

router.post('/upload',isLoggedIn, upload.single("image"), async function(req, res) {
  const user = await usermodel.findOne({ username: req.session.passport.user });//login user do mujhe.
 const post =  await postmodel.create({
    picture: req.file.filename,
    user: user._id,
    caption: req.body.caption
  })

  user.posts.push(post._id);
 await user.save(); // hath se changes kiye h 
 res.redirect("/feed")

});

// router.post('/comments/:id', isLoggedIn, async function(req, res) { 
//   try {
//     console.log("Entered /comments/:id route handler");

//     const user = await usermodel.findOne({ username: req.session.passport.user });
//     console.log("User found:", user);

//     const post = await postmodel.findById(req.params.id)
//     console.log("Post found:", post);

//     if (!post) {
//       console.log("Post not found. Sending 404 response.");
//       return res.status(404).send('Post not found');
//     }

//     const comment = new commentmodel({
//       text: req.body.comment,
//       user: user._id,
//       post: post._id,
//     });

//     await comment.save();
//     console.log("Comment saved:", comment);

//     // Push the comment's ID to the post's comments array
//     post.comments.push(comment._id);
//     await post.save();

//     console.log("Comment ID pushed to post's comments array.");

//     res.redirect("/feed"); // Redirect after saving the comment
//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).send('Internal Server Error');
//   }
// });


router.get('/save/:id', isLoggedIn, async function(req, res) {
  try {
    const postId = req.params.id;
    const user = await usermodel.findOne({ username: req.session.passport.user });

    // Check if the post is already saved by the user
    const isSaved = user.saved.some(savedPost => savedPost.toString() === postId);
    if (isSaved) {
      return res.redirect('/feed'); // If already saved, redirect back to feed
    }

    // Push the post ID to the user's saved array
    user.saved.push(postId);
    await user.save();

    console.log("Post ID pushed to user's saved array.");

    // Redirect the user to the feed page
    res.redirect("/feed");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send('Internal Server Error');
  }
});



function isLoggedIn(req, res, next){
 if(req.isAuthenticated()) return next();
 res.redirect("/login")
}

module.exports = router;
