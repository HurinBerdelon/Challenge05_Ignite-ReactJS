import { GetStaticProps } from 'next';
import { format } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'
import { AiOutlineCalendar } from 'react-icons/ai'
import { MdOutlinePersonOutline } from 'react-icons/md'
import Link from 'next/link'

import { getPrismicClient } from '../services/prismic';

import styles from './home.module.scss';
import { useState } from 'react';

interface Post {
	uid?: string;
	first_publication_date: string | null;
	data: {
		title: string;
		subtitle: string;
		author: string;
	};
}

interface PostPagination {
	next_page: string;
	results: Post[];
}

interface HomeProps {
	postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {

	const [posts, setPosts] = useState(postsPagination)

	async function handleLoadMorePosts(next_page: string) {
		const response = await fetch(next_page)
		const data = await response.json()

		const newPosts: Post[] = data.results.map(post => {
			return {
				uid: post.uid,
				first_publication_date: format(new Date(post.first_publication_date), "dd MMM yyyy", { locale: ptBR }),
				data: {
					title: post.data.title,
					author: post.data.author,
					subtitle: post.data.subtitle
				}
			}
		})

		setPosts(prevPosts => {
			return {
				next_page: data.next_page,
				results: [...prevPosts.results, ...newPosts]
			}
		})

	}

	return (
		<main className={styles.mainContent}>
			{posts.results?.map(post => (
				<Link
					key={post.uid}
					href={`/post/${post.uid}`}
				>
					<a className={styles.postCard} >
						<h2>{post.data.title}</h2>
						<p>{post.data.subtitle}</p>
						<footer className={styles.footer}>
							<div className={styles.date}>
								<AiOutlineCalendar />
								{format(new Date(post.first_publication_date), "dd MMM yyyy", { locale: ptBR })}
							</div>
							<div className={styles.author}>
								<MdOutlinePersonOutline />
								{post.data.author}
							</div>
						</footer>
					</a>
				</Link>
			))}

			{posts.next_page
				? (<>
					<button
						className={styles.loadMore}
						onClick={() => handleLoadMorePosts(posts.next_page)}

					>
						Carregar mais posts
					</button>
				</>
				)
				: null
			}

		</main>
	)
}

export const getStaticProps: GetStaticProps = async () => {
	const prismic = getPrismicClient({});
	const postsResponse = await prismic.getByType('post', {
		pageSize: 2,
	});

	const posts = postsResponse.results.map(post => {
		return {
			data: {
				author: post.data.author,
				subtitle: post.data.subtitle,
				title: post.data.title
			},
			first_publication_date: post.first_publication_date,
			uid: post.uid
		}
	})

	return {
		props: {
			postsPagination: {
				next_page: postsResponse.next_page,
				results: posts
			}
		}
	}
};
