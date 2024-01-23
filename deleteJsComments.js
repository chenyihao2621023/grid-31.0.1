const fs = require('fs-extra');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;

function removeCommentsInDirectory(directory) {
    fs.readdirSync(directory).forEach(file => {
        const fullPath = path.join(directory, file);
        if (fs.statSync(fullPath).isDirectory()) {
            removeCommentsInDirectory(fullPath);
        } else if (fullPath.endsWith('.js')) {
            removeCommentsFromFile(fullPath);
        }
    });
}

function removeCommentsFromFile(filePath) {
    const code = fs.readFileSync(filePath, 'utf-8');
    const ast = parser.parse(code, { sourceType: 'module' });

    traverse(ast, {
        enter(path) {
            if (path.node.leadingComments) {
                path.node.leadingComments = null;
            }
            if (path.node.trailingComments) {
                path.node.trailingComments = null;
            }
            if (path.node.innerComments) {
                path.node.innerComments = null;
            }
        }
    });

    const output = generate(ast, {}, code);
    fs.writeFileSync(filePath, output.code);
}

// 调用函数，删除'./src'目录下的所有注释
removeCommentsInDirectory('./src');
