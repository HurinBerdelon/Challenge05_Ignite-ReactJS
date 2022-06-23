import { GetStaticPaths, GetStaticProps } from 'next';

import { getPrismicClient } from '../../services/prismic';
import { RichText } from 'prismic-dom'
import { AiOutlineCalendar } from 'react-icons/ai'
import { MdOutlinePersonOutline } from 'react-icons/md'
import { RiTimerLine } from 'react-icons/ri'
import styles from './post.module.scss';
import { ptBR } from 'date-fns/locale';
import { format } from 'date-fns';
import { useRouter } from 'next/router';

interface Post {
	uid: string
	first_publication_date: string | null;
	data: {
		title: string;
		subtitle: string
		banner: {
			url: string;
			alt: string
		};
		author: string;
		content: {
			heading: string;
			body: {
				text: string
			}[];
		}[];
	};
}

interface PostProps {
	post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {

	const router = useRouter()

	const numberOfWords = post.data.content.reduce((total, contentItem) => {
		total += contentItem.heading.split(' ').length;

		const words = contentItem.body.map(item => item.text.split(' ').length);
		words.map(word => (total += word));
		return total;
	}, 0);

	const readingTime = Math.ceil(numberOfWords / 200)

	if (router.isFallback) {
		return <div>Carregando...</div>
	}

	return (
		<>
			<div className={styles.banner}>
				<img src={post.data.banner.url} alt={post.data.banner.alt} />
			</div>

			<main className={styles.mainContent}>
				<header>
					<h1 className={styles.title}>{post.data.title}</h1>
					<p>
						<span className={styles.date}>
							<AiOutlineCalendar />
							{format(new Date(post.first_publication_date), "dd MMM yyyy", { locale: ptBR })}
						</span>
						<span className={styles.author}>
							<MdOutlinePersonOutline />
							{post.data.author}
						</span>
						<span className={styles.readTime}>
							<RiTimerLine />
							{`${readingTime} min`}
						</span>
					</p>
				</header>

				{post.data.content.map((content, index) => (
					<section className={styles.content} key={index}>
						<h2 className={styles.subtitle}>
							{content.heading}
						</h2>
						{content.body.map((body, index) => (
							<p key={index} className={styles.sectionContent}>
								{body.text}
							</p>
						))}

					</section>
				))}
			</main>
		</>
	)
}

export const getStaticPaths: GetStaticPaths = async () => {
	const prismic = getPrismicClient({});
	const posts = await prismic.getByType('post', {
		pageSize: 2
	});

	return {
		paths: posts.results.map(post => {
			return {
				params: { slug: post.uid }
			}
		}),
		fallback: true
	}

};

export const getStaticProps: GetStaticProps = async ({ params }) => {
	const { slug } = params
	const prismic = getPrismicClient({});

	const response = await prismic.getByUID('post', String(slug), {});

	// console.log(response.data.content[0])

	const post: Post = {
		uid: response.uid,
		first_publication_date: response.first_publication_date,
		data: {
			title: response.data.title,
			author: response.data.author,
			subtitle: response.data.subtitle,
			banner: {
				alt: response.data.banner.alt,
				url: response.data.banner.url
			},
			content: response.data.content.map(content => {
				return {
					heading: content.heading,
					body: [...content.body]
				}
			})
		}
	}

	// console.log(post.data.content[0].body)

	return {
		props: {
			post
		},
		revalidate: 60 * 60 * 24 // = 24h
	}
};
