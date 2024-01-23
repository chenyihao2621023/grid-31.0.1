const fs = require('fs');
const path = require('path');

// 递归遍历文件夹
function removeCommentsInDirectory(directory) {
    fs.readdirSync(directory).forEach(file => {
        const fullPath = path.join(directory, file);
        if (fs.statSync(fullPath).isDirectory()) {
            removeCommentsInDirectory(fullPath); // 递归遍历子目录
        } else if (fullPath.endsWith('.js')) {
            removeCommentsFromFile(fullPath); // 删除该文件的注释
        }
    });
}

// 删除一个文件中的注释
function removeCommentsFromFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');

    // 高级正则表达式，避免删除非注释内容
    // 删除块注释 /* ... */ 和 行注释 //
    content = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*(?=($|\n))/g, function(match, offset) {
        // 检查注释是否是URL的一部分
        const lineStart = content.lastIndexOf('\n', offset);
        if (content.substring(lineStart, offset).includes('://')) {
            return match; // 如果是URL的一部分，则不删除
        }
        return ''; // 否则，删除注释
    });

    fs.writeFileSync(filePath, content);
}
// 调用函数，替换为你的目录路径
removeCommentsInDirectory('./src');
