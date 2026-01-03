exports.index = async function (reeq, res) {
    const data = require('');
    res.render('./views/index');
}

exports.about = async function (req, res) {
    res.render("../views/home/about");
}