const exp=require('express');
var session = require('express-session')
const app=exp();
const path=require('path');
const body_parser=require('body-parser');
const sql=require('mysql');
const { time } = require('console');
const { readSync } = require('fs');

const con=sql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'movies'
});

con.connect();

app.use(body_parser.urlencoded({extended: true,}));
app.set('view engine', 'ejs');
app.use(exp.static(__dirname+'/src'));
app.use(session({ secret: 'Kalaiyarasan S', cookie: { maxAge: 600000 }}));



app.listen(process.env.PORT || '3000',()=>{
    console.log("server running....");
});

app.get('/',(req,res)=>{
    con.query('SELECT * FROM movie ORDER BY rating Desc LIMIT 3 ',(e,data)=>{
        if(e) throw(e);
        // console.log(data);
        if(req.session.user){
            res.render('index',{topmovies:data,user:req.session.user});
        }
        else{
            res.render('index',{topmovies:data,user:''});
        }
    })
    
})

app.get('/login',(req,res)=>{
    if(req.session.error){
        res.render('auth/login',{error:req.session.error});
    }
    else{
        res.render('auth/login',{error:''});
    }
    req.session.destroy();
})

app.get('/signup',(req,res)=>{
    if(req.session.error){
        res.render('auth/register',{error:req.session.error});
    }
    else{
        res.render('auth/register',{error:''});
    }
    req.session.destroy();
})

app.post('/auth/login',(req,res)=>{
    username=req.body.username;
    password=req.body.password;
    if(username.length>0 && password.length>0){
        if(password.length>6){
        con.query('SELECT * FROM user WHERE (username=? or email=?) and password=?',[username,username,password],(e,data)=>{
            if(data.length==1){
            console.log('Logged in Successfully..');
            req.session.user=data[0].username;
            req.session.uid=data[0].uid;
            //console.log(session.user);
            return res.redirect('/');
            }
            else{
                req.session.error='Username or password invalid'; 
                return res.redirect('/login'); 
            }
        });
        }
        else{
            req.session.error='password length must be greater than 5';
            return res.redirect('/login'); 
        }

    }
})

app.get('/auth/logout',(req,res)=>{
    req.session.destroy();
    return res.redirect('/');
})

app.post('/auth/register',(req,res)=>{
    name=req.body.name;
    number=req.body.number;
    email=req.body.email;
    password=req.body.password;
    cpassword=req.body.cpassword;
    address=req.body.address;
    
    if(name.length>0 && number.length>0 && email.length>0 && password.length>0 && cpassword.length>0 && address.length>0){
        con.query('SELECT * FROM user WHERE username=? or email=?',[name,email],(e,data)=>{
            if(e) throw(e);
            if(data.length==0){
                if(cpassword===password && password.length>6){
                    if(number.length==10){
                    con.query('INSERT INTO user (username,password,address,mobile,email) VALUES (?,?,?,?,?)',[name,password,address,number,email],(e)=>{
                        if(e) throw(e);
                        req.session.user=name;
                        con.query('SELECT uid FROM user WHERE username=? AND email=?',[name,email],(e,data2)=>{
                            if(e) throw(e)
                            req.session.uid=data2[0].id;
                        })
                        console.log("successfully added");
                        //console.log(session.user);
                        return res.redirect('/');
                    })
                    }
                    else{
                        req.session.error="Mobile Number Must be a length of 10";
                        return res.redirect('/signup')
                    }
        
                }
                else{
                    req.session.error='password not same';
                    return res.redirect('/signup')    
                }
            }
            else{
                req.session.error='User already present';
                return res.redirect('/signup')
            }
        })
        

    }
    else{
        req.session.error='All fields must be required';
        return res.redirect('/signup')
    }
})


app.get('/register/:mid',(req,res)=>{
    if(req.session.user){
    id=req.params.mid;
    con.query('SELECT * FROM movie WHERE mid='+id,(e,data)=>{
        if(e) throw(e);
        // console.log(data);
        res.render('task/register',{movie:data,user:req.session.user});
    })
    }
    else{
        return res.redirect('/login');
    }
})

app.get('/movie/show/:mid',(req,res)=>{
    id=req.params.mid;
    con.query('SELECT * FROM movie WHERE mid='+id,(e,data)=>{
        if(e) throw(e);
        // console.log(data);
            con.query('SELECT * FROM review WHERE mid=?',[id],(e,rdata)=>{
                if(e) throw(e);
                if(req.session.user){
                    res.render('pages/show',{movie:data,review:rdata,uid:req.session.uid,user:req.session.user});
                }
                else{
                    res.render('pages/show',{movie:data,review:rdata,user:''});
                }

            });
    })
})


app.get('/movies',(req,res)=>{
    con.query('SELECT * FROM movie ORDER BY name ',(e,data)=>{
        if(e) throw(e);
        // console.log(data);
        if(req.session.user){
            res.render('pages/movies',{movies:data,user:req.session.user});
        }
        else{
            res.render('pages/movies',{movies:data,user:''});
        }
    })
})

app.get('/movies/comedy',(req,res)=>{
    con.query('SELECT * FROM movie WHERE category="comedy" ORDER BY name ',(e,data)=>{
        if(e) throw(e);
        // console.log(data);
        if(req.session.user){
            res.render('pages/comedy',{cmovies:data,user:req.session.user});
        }
        else{
            res.render('pages/comedy',{cmovies:data,user:''});
        }

    })
})

app.get('/movies/action',(req,res)=>{
    con.query('SELECT * FROM movie WHERE category="action" ORDER BY name ',(e,data)=>{
        if(e) throw(e);
        // console.log(data);
        if(req.session.user){
            res.render('pages/action',{amovies:data,user:req.session.user});
        }
        else{
            res.render('pages/action',{amovies:data,user:''});
        }
    })
})

app.get('/movies/thriller',(req,res)=>{
    con.query('SELECT * FROM movie WHERE category="thriller" ORDER BY name ',(e,data)=>{
        if(e) throw(e);
        // console.log(data);
        if(req.session.user){
            res.render('pages/thriller',{tmovies:data,user:req.session.user});
        }
        else{
            res.render('pages/thriller',{tmovies:data,user:''});
        }
        
    })
})


app.post('/task/addreview/:mid',(req,res)=>{
    mid=req.params.mid;
    review=req.body.review;
    if(review.length>0){
        con.query('INSERT INTO review(uid,mid,review) VALUES (?,?,?)',[req.session.uid,mid,review],(e)=>{
            if(e) throw(e);
        })
        return res.redirect('/movie/show/'+mid);
    }
})

app.post('/movie/register/registerprocess',(req,res)=>{
    //uid=req.session.uid;
    mid=req.body.mid;
    theater=req.body.theater;
    times=req.body.time;
    return res.redirect('/movie/register/registerprocess/'+mid+'/'+theater+'/'+times);
    //seats=JSON.stringify(req.body.seats);
    // if(theater.length>0 && times.length>0 && seats.length>0 ){
    //     con.query('INSERT INTO seatbook(uid,mid,theater,showtime,seatno) values(?,?,?,?,?)',[uid,mid,theater,times,seats],(e)=>{
    //         if(e) throw(e);
    //     });
    //     console.log('Booked Successfully');
    // }
    // else{
    //     console.log("some fields are empty.Please check...");
    // }
})

app.get('/movie/register/registerprocess/:mid/:theater/:times',(req,res)=>{
    if(req.session.user){
        mid=req.params.mid;
        theater=req.params.theater;
        times=req.params.times;
        con.query('SELECT seatno FROM seatbook WHERE mid=? AND theater=? AND showtime=?',[mid,theater,times],(e,data)=>{
            if(e) throw(e)
            //console.log(data,mid,theater,times);
            arr=[]
            data.forEach(el=>{
                var val=JSON.parse(el.seatno);
                val.forEach(el2=>{
                    arr.push(el2);
                })
            });
            con.query('SELECT name,pay from movie WHERE mid=?',[mid],(er,data2)=>{
                if(er) throw(er)
                return res.render('task/registerseat',{seats:arr,user:req.session.user,other:[{'mid':mid,'theater':theater,'time':times,'amount':data2[0].pay,'name':data2[0].name}]});
            })
        })
    }
    else{
        return res.redirect('/login');
    }
})


app.post('/movie/register/paymentprocess',(req,res)=>{
    uid=req.session.uid;
    mid=req.body.mid;
    theater=req.body.theater;
    times=req.body.time;
    seats=req.body.seats;
    moviename=req.body.mname;
    //console.log(seats);
    amount=(seats.length)*req.body.amount;
    var now = new Date();
    if(theater.length>0 && times.length>0 && seats.length>0 ){
        
        return res.render('pages/payment',{user:req.session.user,details:[{
            'mid':mid,
            'moviename':moviename,
            'theater':theater,
            'times':times,
            'seats':seats,
            'amount':amount,
            'booked_date':now.toUTCString(),
        }]})
    }
    else{
        console.log("some fields are empty.Please check...");
    }
})



app.post('/movie/register/finalprocess',(req,res)=>{
    uid=req.session.uid;
    mid=req.body.mid;
    theater=req.body.theater;
    times=req.body.time;
    seats=req.body.seats;
    amount=req.body.amount;
    now = req.body.booked_date;
    if(theater.length>0 && times.length>0 && seats.length>0 && amount>0 && now.length>0 ){
        
        seats=JSON.stringify(seats);
        con.query('INSERT INTO seatbook(uid,mid,theater,showtime,seatno,booked_date,amount) values(?,?,?,?,?,?,?)',[uid,mid,theater,times,seats,now,amount],(e)=>{
            if(e) throw(e);
            console.log('Booked Successfully');
        });
        return res.redirect('/pages/bookings');
    }
    else{
        console.log("some fields are empty.Please check...");
    }
})

app.get('/pages/bookings',(req,res)=>{
    if(req.session.user){
    uid=req.session.uid;
    con.query('SELECT a.name,b.sid,b.showtime,b.seatno,b.theater,b.booked_date,b.amount FROM movie a JOIN seatbook b ON a.mid=b.mid WHERE uid=? ORDER by b.booked_date DESC',[uid],(e,data)=>{
        if(e) throw(e)
        //console.log(data);
        return res.render('pages/mybookings',{bookings:data,user:req.session.user});
    });
    }
    else{
        return res.redirect('/login');
    }
})

app.get('/task/cancel/:sid',(req,res)=>{
    sid=req.params.sid;
    con.query('DELETE FROM seatbook WHERE sid=?',[sid],(e)=>{
        if(e) throw(e)
    })
    return res.redirect('/pages/bookings');
})