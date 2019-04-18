const Sequelize = require("sequelize");
const {models} = require("../models");

// Autoload el quiz asociado a :quizId
exports.load = (req, res, next, quizId) => {

    models.quiz.findByPk(quizId)
    .then(quiz => {
        if (quiz) {
            req.quiz = quiz;
            next();
        } else {
            throw new Error('There is no quiz with id=' + quizId);
        }
    })
    .catch(error => next(error));
};


// GET /quizzes
exports.index = (req, res, next) => {

    models.quiz.findAll()
    .then(quizzes => {
        res.render('quizzes/index.ejs', {quizzes});
    })
    .catch(error => next(error));
};


// GET /quizzes/:quizId
exports.show = (req, res, next) => {

    const {quiz} = req;

    res.render('quizzes/show', {quiz});
};


// GET /quizzes/new
exports.new = (req, res, next) => {

    const quiz = {
        question: "",
        answer: ""
    };

    res.render('quizzes/new', {quiz});
};

// POST /quizzes/create
exports.create = (req, res, next) => {

    const {question, answer} = req.body;

    const quiz = models.quiz.build({
        question,
        answer
    });

    // Saves only the fields question and answer into the DDBB
    quiz.save({fields: ["question", "answer"]})
    .then(quiz => {
        req.flash('success', 'Quiz created successfully.');
        res.redirect('/quizzes/' + quiz.id);
    })
    .catch(Sequelize.ValidationError, error => {
        req.flash('error', 'There are errors in the form:');
        error.errors.forEach(({message}) => req.flash('error', message));
        res.render('quizzes/new', {quiz});
    })
    .catch(error => {
        req.flash('error', 'Error creating a new Quiz: ' + error.message);
        next(error);
    });
};


// GET /quizzes/:quizId/edit
exports.edit = (req, res, next) => {

    const {quiz} = req;

    res.render('quizzes/edit', {quiz});
};


// PUT /quizzes/:quizId
exports.update = (req, res, next) => {

    const {quiz, body} = req;

    quiz.question = body.question;
    quiz.answer = body.answer;

    quiz.save({fields: ["question", "answer"]})
    .then(quiz => {
        req.flash('success', 'Quiz edited successfully.');
        res.redirect('/quizzes/' + quiz.id);
    })
    .catch(Sequelize.ValidationError, error => {
        req.flash('error', 'There are errors in the form:');
        error.errors.forEach(({message}) => req.flash('error', message));
        res.render('quizzes/edit', {quiz});
    })
    .catch(error => {
        req.flash('error', 'Error editing the Quiz: ' + error.message);
        next(error);
    });
};


// DELETE /quizzes/:quizId
exports.destroy = (req, res, next) => {

    req.quiz.destroy()
    .then(() => {
        req.flash('success', 'Quiz deleted successfully.');
        res.redirect('/quizzes');
    })
    .catch(error => {
        req.flash('error', 'Error deleting the Quiz: ' + error.message);
        next(error);
    });
};


// GET /quizzes/:quizId/play
exports.play = (req, res, next) => {

    const {quiz, query} = req;

    const answer = query.answer || '';

    res.render('quizzes/play', {
        quiz,
        answer
    });
};


// GET /quizzes/:quizId/check
exports.check = (req, res, next) => {

    const {quiz, query} = req;

    const answer = query.answer || "";
    const result = answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim();

    res.render('quizzes/result', {
        quiz,
        result,
        answer
    });
};

// // GET /quizzes/randomplay
exports.randomplay = (req, res, next) => {
    //const session = req.session;
    const {session} = req;

    if(typeof(session.randomPlay) === 'undefined'){
      session.randomPlay = [];
    }
    models.quiz.findAll({
      where: {
        id: {
          [Sequelize.Op.notIn]: session.randomPlay }
      }//,
      //limit: 1
    })
    .then(quizzes => {

      let a = Math.random();
      let b = quizzes.length-1;
      let c= a*b;
      let random = Math.round(c);

      const quiz = quizzes[random];
      const score = session.randomPlay.length;
      if(quiz) {
        console.log("The id is ${quiz.id}");
        res.render('quizzes/random_play', {
          quiz,
          score
        });
      } else {
      session.randomPlay = [];
      res.render('quizzes/random_none', {
        score
      });
    }
  })
  .catch(error => next(error));

};

// GET /quizzes/randomcheck
exports.randomcheck = (req, res, next) => {

  const {quiz, query, session} = req;

  const answer = query.answer || "";
  const result = answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim();

  score = session.randomPlay.length;

  if(result){
    session.randomPlay.push(quiz.id)
    score++;
  } else {
    session.randomPlay = [];
  }

  res.render('quizzes/random_result', {
    quiz,
    result,
    score,
    answer
  });

};

// exports.randomplay = (req, res, next) =>{
//
//     req.session.randomPlay =  req.session.randomPlay || [];
//
//     models.quiz.findAll({where: {id:{[Sequelize.Op.notIn]: req.session.randomPlay}}})
//     .then(quizzes =>{
//         let quiz = quizzes[Math.floor(Math.random() * quizzes.length)];
//         let score=req.session.randomPlay.length || 0;
//         if(quizzes.length===0){
//             req.session.randomPlay = [];
//             res.render('quizzes/random_none',{score});
//             return;
//         }
//         res.render('quizzes/random_play',{score,quiz});
//     })
//     .catch(Sequelize.ValidationError, error => {
//         req.flash('error', 'There are errors in the form:');
//         error.errors.forEach(({message}) => req.flash('error', message));
//         res.render('quizzes/random_play', {score,quiz});
//     })
//     .catch(error => {
//         req.flash('error', 'Error playing the Quiz: ' + error.message);
//         next(error);
//     });
// };
//
// exports.randomcheck = (req, res, next) =>{
//
//     const {quiz, query} = req;
//
//     const answer= query.answer || "";
//     const result = answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim();
//     let score;
//     if(result) {
//         req.session.randomPlay.push(quiz.id);
//         score=req.session.randomPlay.length;
//     }else{
//         score=req.session.randomPlay.length;
//         req.session.randomPlay=[];
//     }
//
//
//     res.render('quizzes/random_result',{
//         answer,
//         result,
//         score
//     });
// };
