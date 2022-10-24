module.exports = async (req, res, next) => {
    if(req.session.isAuth){
        if(req.session._id){
            if(req.session._id !== null){
                next();
            }
        }
    }else{
        res.redirect('/login')
    }
}