exports.index = async function (reeq, res) {
    console.log('Контроллер включен!')
    try {
        const express = require('express');
        const fs = require('fs');
        const path = require('path');
        const hbs = require('hbs');
        // const source = fs.readFileSync('./views/index.hbs', 'utf8');
        // console.log('✅ Файл index.hbs прочитан, длина:', source.length);
        
        // const template = hbs.compile(source);
        // console.log('✅ Шаблон скомпилирован');
        
        // const html = template({ title: 'Test' });
        // console.log('✅ HTML сгенерирован, длина:', html.length);
        
        // res.type('html').send(html);
        res.render('index');
    } catch (err) {
        console.error('💥 КРИТИЧЕСКАЯ ОШИБКА РЕНДЕРА:', err);
        res.status(500).send(`<h1>Ошибка Handlebars</h1><pre>${err.stack}</pre>`);
    }
}

exports.about = async function (req, res) {
    res.render("../views/home/about");
}