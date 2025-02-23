<template>
    <el-scrollbar
        style="font-family: Arial, sans-serif; line-height: 1.6;  color: #4b5563;height: 70vh;overflow: auto;padding: 0 6px;">

        <h3>一、 软件简介</h3>
        <p> 该软件是一款便捷的照片和视频文件整理工具，能够自动将您的照片和视频按日期分类存储到指定文件夹中，帮助您高效管理媒体文件。</p>

        <h3>二、 使用步骤</h3>
        <ol>
            <li><strong>选择源文件夹</strong>
                <ul style="padding-left: 12px;">
                    <li>点击“源文件夹”右侧的“浏览”按钮，选择需要整理的照片和视频所在的文件夹。</li>
                </ul>
            </li>
            <li><strong>选择目标文件夹</strong>
                <ul style="padding-left: 12px;">
                    <li>点击“释放文件夹”右侧的“浏览”按钮，选择整理后文件存放的目标文件夹。</li>
                </ul>
            </li>
            <li><strong>设置文件类型（可选）</strong>
                <ul style="padding-left: 12px;">
                    <li>默认情况下，软件会整理常见的图片类型（.jpg, .jpeg, .png, .arw）和视频类型（.mp4, .3gp, .mov）。</li>
                </ul>
            </li>
            <li><strong>选择处理模式</strong>
                <ul style="padding-left: 12px;">
                    <li><strong>移动模式：</strong> 将文件从源文件夹移动到目标文件夹。</li>
                    <li><strong>复制模式：</strong> 将文件从源文件夹复制到目标文件夹，源文件夹中的文件保留。</li>
                </ul>
            </li>
            <li><strong>设置文件夹结构（可选）</strong>
                <ul style="padding-left: 12px;">
                    <li>默认情况下，软件会按“年-月”的格式创建文件夹，例如“2023-10”。</li>
                    <li>如果需要自定义文件夹结构，可以修改“文件夹结构”中的格式。</li>
                </ul>
            </li>
            <li><strong>开始整理</strong>
                <ul style="padding-left: 12px;">
                    <li>点击“运行”按钮，软件将开始整理照片和视频文件。</li>
                    <li>您可以在“执行进度”中查看整理进度。</li>
                </ul>
            </li>
        </ol>

        <h3>三、 特别说明</h3>
        <ul style="padding-left: 12px;">
            <li><strong>未识别的文件格式：</strong> 如果遇到未识别的文件格式，软件会将这些文件移动到目标文件夹中的“TEMP”文件夹中，以便您后续手动处理。</li>
        </ul>

        <h3>四、 联系方式</h3>
        <p>如果您在使用过程中遇到任何问题，请联系我们：</p>
        <ul style="padding-left: 12px;">
            <li>邮箱：<a href="mailto:275050943@qq.com" style="color: #3B82F6; text-decoration: none;">275050943@qq.com</a>
            </li>
        </ul>
    </el-scrollbar>
</template>

<script>
export default {
    data() {
        return {};
    },
    methods: {}
};
</script>

<style lang="scss" scoped></style>