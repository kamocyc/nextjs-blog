import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import remark from 'remark'
import html from 'remark-html'

export interface BlogMeta {
  id: string;
  date: string;
  title: string;
  contentHtml?: string;
}

export interface StaticProps {
  allPostsData: BlogMeta[];
}

const postsDirectory = path.join(process.cwd(), 'posts');

export async function getSorterPostsData(): Promise<BlogMeta[]> {
  // Get file names under /posts
  const fileNames = await fs.promises.readdir(postsDirectory);
  
  console.log({ fileNames: fileNames});
  
  // Use Promise.all to wait all mapped promises are finished (otherwise we cannot sort elements)
  const allPostsData = await Promise.all(
      fileNames.map(async fileName => {
      // Remove ".md" from file name to get id
      const id = fileName.replace(/\.md$/, '');
      
      // Read markdown file as string
      const fullPath = path.join(postsDirectory, fileName);
      const fileContens = await fs.promises.readFile(fullPath, 'utf8');
      
      // Use gray-matter to parse the post metadata section
      const matterResult = matter(fileContens);
      
      // Combine the data with the id
      // TODO: make sure matter data has `date` and `title`
      return {
        id,
        ...matterResult.data
      } as BlogMeta;
  }));
  
  return allPostsData.sort((a, b) => {
    if (a.date < b.date) {
      return 1;
    } else {
      return -1;
    }
  })
}

export async function getAllPostIds() {
  const fileNames = await fs.promises.readdir(postsDirectory);
  
  return fileNames.map(fileName => ({params: {id: fileName.replace(/\.md$/, '')}}));
}

export async function getPostData(id: string) {
  const fullPath = path.join(postsDirectory, `${id}.md`);
  const fileContents = await fs.promises.readFile(fullPath, 'utf8');

  // Use gray-matter to parse the post metadata section
  const matterResult = matter(fileContents);

  // Use remark to convert markdown into HTML string
  const processedContent = await remark()
    .use(html)
    .process(matterResult.content);
  const contentHtml = processedContent.toString();

  // Combine the data with the id and contentHtml
  return {
    id,
    contentHtml,
    ...matterResult.data
  };
}