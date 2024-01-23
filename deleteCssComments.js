const fs = require('fs-extra');
const path = require('path');
const postcss = require('postcss');

function removeCssCommentsInDirectory(directory) {
    fs.readdirSync(directory).forEach(file => {
        const fullPath = path.join(directory, file);
        if (fs.statSync(fullPath).isDirectory()) {
            removeCssCommentsInDirectory(fullPath); // 递归处理子目录
        } else if (fullPath.endsWith('.css')) {
            removeCssCommentsFromFile(fullPath); // 删除该CSS文件的注释
        }
    });
}

function removeCssCommentsFromFile(filePath) {
    const css = fs.readFileSync(filePath, 'utf-8');
    postcss()
        .process(css, { from: undefined })
        .then(result => {
            const newCss = result.root.toString(); // 转换成字符串
            fs.writeFileSync(filePath, newCss);
        });
}

// 调用函数，删除'./src'目录下的所有CSS注释
removeCssCommentsInDirectory('./src');
