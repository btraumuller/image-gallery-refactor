"use client";

import Image from "next/image";

import { galleryListData } from "../types";

export default function GalleryListings(props:galleryListData){
    return(
        <>
        <div className="tab-content-container">
                { props.isLoading &&
                    <p className="is-loading"><span>{props.isLoadingLabel}</span></p>
                }
                {!props.hideList &&
                    <ul className="project-gallery__grid">
                        { 
                            props.projectContent.map((project, i) => 
                                <li key={i}>
                                    <a href={project.Link} target="_blank" tabIndex={0}>
                                        <span className="image-label"><span>{props.hoverLabel}</span></span>
                                        <Image src={project.ImageSrc} alt={project.Name} width={400} height={400} loading="lazy" />
                                    </a>
                                </li>
                            )
                        }
                    </ul>
                }
                
                { props.isNoResults &&
                    <p className="no-more-results">{props.noResults}</p>
                }
            </div>
            { props.showLoadMore &&
                <div className="project-gallery__load-more-container"><button onClick={props.loadMoreAction}>{props.loadMoreLabel}</button></div>
            }
        </>
    )
}