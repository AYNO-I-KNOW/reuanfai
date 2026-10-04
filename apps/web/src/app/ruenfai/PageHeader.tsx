import type {ReactNode} from 'react';
import styles from './PageHeader.module.css';
/** Shared title baseline and action slot for all mobile tabs. */
export default function PageHeader({title,subtitle,leading,action}:{title:string;subtitle?:string;leading?:ReactNode;action?:ReactNode}){return <header className={styles.header}>{leading&&<div className={styles.leading}>{leading}</div>}<div className={styles.copy}><h1 className={styles.title}>{title}</h1>{subtitle&&<p className={styles.subtitle}>{subtitle}</p>}</div>{action&&<div className={styles.action}>{action}</div>}</header>}
