const fs = require('fs');
const path = require('path');

function deleteMinCssFiles(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            deleteMinCssFiles(filePath); // 递归处理子目录
        } else if (file.endsWith('.min.css')) {
            fs.unlinkSync(filePath);
            console.log(`Deleted: ${filePath}`);
        }
    }
}

const directory = './src'; // 替换为您要处理的目录路径
deleteMinCssFiles(directory);
