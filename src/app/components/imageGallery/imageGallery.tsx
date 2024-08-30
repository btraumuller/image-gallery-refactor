"use client"

import './css/imageGallery.css';
import GalleryListings from './components/galleryListings';
import { useId } from 'react';
import Select, { SelectInstance } from 'react-select';
import { useSearchParams, usePathname, useRouter } from "next/navigation";
// @ts-ignore
import { Splide, SplideSlide } from '@splidejs/react-splide'; 
import { useEffect, useReducer, useState, useRef } from 'react';
import axios from 'axios';

import { 
    OptionType, 
    ProjectListType, 
    DataAPIObjectType, 
    ActionType, 
    BooleanStateTypes, 
    LabelTypes, 
    SplideOptionTypes,
    URLSelectionsType 
} from './types';

const API_KEY = process.env.NEXT_PUBLIC_SPLASH_API_KEY

const SplideOptions: SplideOptionTypes = {
    gap: '3rem',
    perPage: 8,
    perMove:8,
    pagination: false,
    isNavigation: true,
    rewind: false,
}

const Labels:LabelTypes = {
    noResultsLabel: 'There are no results to display',
    loadMoreLabel: 'load more',
    viewDetailsLabel: 'Details',
    cardHoverLabel: 'See more',
    totalResultsLabel: 'Results',
    loadingLabel: 'Your Images are loading',
}

let booleanStates: BooleanStateTypes = {
    isLoading: true,
    allCards: true,
    isNoResults: false,
}

let initialDataState:any = {
    tabFilters: [
        "photos",
        "collections"
    ],
    filterTags:[],
    dropdownFilters: [
        "Basement",
        "Bathroom",
        "Bedroom",
        "Commercial",
        "Dining Room",
        "Entertainment",
        "Kids Room",
        "Kitchen",
        "Laundry",
        "Living Room",
        "Media Room",
        "Office",
        "Outdoor",
        "Product Focus"
    ],
    designStyleTags:[],
    projectList:[],
    cardsLoaded: 0,
    hideList: true,
    totalResultsLabel: '',
}

let urlSelections: URLSelectionsType = {
    roomSelection: '',
    designSelection: '',
    page: 1,
    callType: 'Reset',
    cardsPerPage: 0,
    mobileLoad: 4,
    desktopLoad: 10,
}

function objectGenerator( data:string[], roomSelection:string):OptionType[]{
    
    let Selections = data,
        selectionsIdArray = [];

    for (let selection of Selections){
        
        let selectionId:string = selection.toLowerCase(),
            isActive:boolean = (selection === roomSelection) ? true : false, 
            option:OptionType = {
                value: encodeURIComponent(selectionId),
                label: selection,
                active: isActive
            };

        selectionsIdArray.push(option);
    }

    return selectionsIdArray;
}

function getProjectList(newprojectListData:[], currentProjectListData:ProjectListType[], callType:string, dataType:string):[ProjectListType[],boolean,number]{

    type ProjectCardType = {
        Name:string;
        ImageSrc: string;
        Link: string;
    }

    type ProjectData = {
        alt_description: string;
        urls: {
            thumb: string;
            regular: string;
        };
        cover_photo: {
            description: string;
            urls: {
                thumb: string;
                regular: string;
            }
            links:{
                html:string
            }
        }
    }

    let projectList:ProjectCardType[] = [],
        hideList:boolean = true; 
     
    if (callType === 'Reset'){
        projectList = [];
    }else{
        projectList = currentProjectListData;
    }

    if(newprojectListData.length > 0){

        let cardName:string, cardImageSrc:string, cardLink:string;

        newprojectListData.forEach((project:ProjectData) => {

            switch(dataType){
                case('photos'):
                    cardName = project.alt_description;
                    cardImageSrc = project.urls.thumb;
                    cardLink = project.urls.regular;
                    break;
                case('collections'):
                    cardName = project.cover_photo.description;
                    cardImageSrc = project.cover_photo.urls.thumb;
                    cardLink = project.cover_photo.links.html;
                    break;
                default:
                    cardName = project.alt_description;
                    cardImageSrc = project.urls.thumb;
                    cardLink = project.urls.regular;
                    break;
            }

            let card: ProjectCardType = {
                Name: cardName,
                ImageSrc: cardImageSrc,
                Link: cardLink
            }
            
            projectList.push(card);
            
        });

        hideList = false;
    }else{
        let emptyCard = {
            Name:'',
            ImageSrc:'',
            Link:'',
        };
        hideList = true;
        projectList.push(emptyCard);
        
    }
    let cardsCounted= projectList.length;
    return([projectList, hideList, cardsCounted]);
}

function getData(state: any , action: ActionType){

    let total:number = Number(action.data.data.total);
    let totalResults:string = action.data.data.total + ' '+ Labels.totalResultsLabel;
    let [projectListData, hideListBoolean , cardsCounted] = getProjectList(action.data.data.results, state.projectList, action.type, action.data.dataType); 
    let cardCount:number = Number(cardsCounted);
    let isAllLoaded:boolean = (total <= cardCount) ? false : true;

    switch(action.type){
        
        case 'Reset':
            return{
                tabFilters: state.tabFilters,
                filterTags: objectGenerator(state.tabFilters, action.data.dataType),
                dropdownFilters: state.dropdownFilters,
                designStyleTags: objectGenerator(state.dropdownFilters, action.data.dropdownType),
                projectList: projectListData,
                hideList: hideListBoolean,
                totalResultsLabel: totalResults,
                cardsLoaded: cardCount,
                showLoadMore: true
            };
        case 'LoadMore':
                return{
                    tabFilters: state.tabFilters,
                    filterTags: state.filterTags,
                    designStyleTags: state.designStyleTags,
                    dropdownFilters: state.dropdownFilters,
                    projectList: projectListData,
                    hideList: hideListBoolean,
                    totalResultsLabel: totalResults,
                    cardsLoaded: cardCount,
                    showLoadMore: isAllLoaded   
                }
        case 'Error':
            return{
                noResultsLabel:"There is something wrong. Please try again later",
            };
        default: return state;
    }
    
}

export default function ImageGallery(){
    const SplideRef = useRef();
    const SelectRef = useRef<SelectInstance | null>(null);
    const [BooleanValues, setBooleanValues] = useState(booleanStates);
    const [Selections, setSelections] = useState(urlSelections);
    const [DataState, retrieveData] = useReducer(getData, initialDataState);
    const [CallEffect, setCallEffect] = useState(false);
    const SearchParam = useSearchParams();
    const {replace} = useRouter();
    const PathName = usePathname();

    const RoomTypeParam = SearchParam.get("roomType");
    const StyleTypeParam = SearchParam.get("designType");
    const CurrentCards = SearchParam.get("currentCards");
    

    const SelectAction = (eventValue: string | {value:string}, categoryType:string) => {
        let selectValue:string = (typeof eventValue === 'string')? eventValue : eventValue.value,
        urlParams: URLSearchParams = new URLSearchParams(SearchParam),
        urlCardCount:number = (window.outerWidth < 1025)? urlSelections.mobileLoad : urlSelections.desktopLoad;        
        if (categoryType === "Room"){
            
            let designSelectionValue:string = Math.random.toString();
            setSelections((prevState) => ({...prevState, 
                roomSelection: selectValue, 
                designSelection: designSelectionValue, 
                page: 1, 
                cardsPerPage:urlCardCount,
                callType: 'Reset'}));

            urlParams.set('roomType', selectValue);
            urlParams.set('designType', '');
            
        }else{

            setSelections((prevState) => ({...prevState, 
                designSelection: selectValue,
                page: 1, 
                cardsPerPage:urlCardCount,
                callType: 'Reset'})),
            urlParams.set('designType', selectValue);
            
        }

        let inititalCards = (window.outerWidth < 1025)? urlSelections.mobileLoad : urlSelections.desktopLoad;

        urlParams.set('currentCards', inititalCards.toString());

        replace(`${PathName}?${urlParams.toString()}`, {scroll: false});

    }

    const CheckKey = (event:KeyboardEvent, eventValue: string | {value:string}, categoryType:string) => {
        if (event.key === 'Enter'){
            SelectAction(eventValue, categoryType);
        }
    }

    const LoadMore = () => {

        let additonalCards:number = (window.outerWidth < 1025)? urlSelections.mobileLoad : urlSelections.desktopLoad,
            totalCardsLoaded:number = DataState.cardsLoaded + additonalCards,
            urlParams: URLSearchParams = new URLSearchParams(SearchParam);

        setSelections((prevState) => ({...prevState, page: Selections.page + 1, cardsPerPage:additonalCards, callType: 'LoadMore'}));

        urlParams.set('currentCards', totalCardsLoaded.toString());

        replace(`${PathName}?${urlParams.toString()}`, {scroll: false});

        setCallEffect(!CallEffect);
    
    }

    useEffect(() => {

        let urlRoom:string,
            urlQuery:string,
            urlCardCount:number

            urlRoom = (RoomTypeParam) ? RoomTypeParam : DataState.tabFilters[0];
            urlCardCount = (CurrentCards) ? parseInt(CurrentCards) : 10;
            urlQuery= (StyleTypeParam) ? StyleTypeParam : Math.random.toString();

            setSelections((prevState) => ({...prevState, roomSelection: urlRoom, designSelection: urlQuery, cardsPerPage: urlCardCount}))

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {

        const Controller = new AbortController();

        setBooleanValues((prevState) => ({...prevState, isLoading: true}));

       if (Selections.roomSelection !== ''){

            let api = `https://api.unsplash.com/search/${Selections.roomSelection}?client_id=${API_KEY}&page=${Selections.page}&per_page=${Selections.cardsPerPage}&query=${Selections.designSelection}`;
         
            axios.get(api, {signal: Controller.signal})
                .then(response =>{

                    if(response.data.total === 0){
                        setBooleanValues((prevState) => ({...prevState, isNoResults: true}));
                    }else{

                        let dataObject:DataAPIObjectType = {
                            data: response.data,
                            dataType: Selections.roomSelection,
                            dropdownType: Selections.designSelection
                        }

                        retrieveData({
                            type: Selections.callType, 
                            data: dataObject
                        });
                        
                        setBooleanValues((prevState) => ({...prevState, isNoResults: false}));
                    }

                }).catch(() => {
                    retrieveData({type: 'Error', data: { data: { total: 0, results: [] }, dataType: '', dropdownType:'' }});
                });

                setBooleanValues((prevState) => ({...prevState, isLoading: false}));   
                
                return () =>{ 
                    Controller.abort();
                }
          }
              
    }, [Selections.designSelection, Selections.roomSelection, CallEffect, Selections.page, Selections.callType, Selections.cardsPerPage]);
    
        
    return(
        <div className='project-gallery'>
            <div className="project-gallery__filters">
                    <Splide className="nav nav-TabsType splide__list" role="tablist" options={SplideOptions} ref={SplideRef}>
                        {
                            DataState.filterTags.map((tab:{active:boolean, value:string, label:string}, i:number) =>
                                <SplideSlide  
                                    key={i}  
                                    role="presentation" 
                                    className= {`splide__slide ${tab.active ? 'active' : ''}`} 
                                    onClick={() => SelectAction(tab.value, 'Room')} 
                                    onKeyUp={(event:KeyboardEvent) => CheckKey(event,tab.value, 'Room')}>
                                        {tab.label}
                                </SplideSlide>
                            )
                        }
                    </Splide>
                </div>

                <Select 
                    options={DataState.filterTags} 
                    isSearchable={false} 
                    value={DataState.filterTags.filter((option:{value:string}) => option.value === Selections.roomSelection)}
                    placeholder="Select Room" 
                    className="select-dropdown-container mobile-filter" 
                    classNamePrefix="select-dropdown" 
                    onChange={(e: { value: string }) => SelectAction(e, 'Room')} />
                
                <p className="project-gallery__counter">{DataState.totalResultsLabel}</p>

                <Select 
                    options={DataState.designStyleTags}
                    value={DataState.designStyleTags.filter((option:{value:string}) => option.value === Selections.designSelection)} 
                    placeholder="Select Styles" 
                    isSearchable={false} 
                    className="select-dropdown-container" 
                    classNamePrefix="select-dropdown" 
                    onChange={(e: unknown) => SelectAction(e as { value: string }, 'Design')}
                    instanceId={useId()}
                    ref={SelectRef}
                />
                
                <GalleryListings 
                    hideList={DataState.hideList} 
                    projectContent={DataState.projectList} 
                    loadMoreAction={LoadMore} 
                    loadMoreLabel={Labels.loadMoreLabel}
                    isLoadingLabel={Labels.loadingLabel} 
                    hoverLabel={Labels.cardHoverLabel} 
                    showLoadMore={BooleanValues.allCards} 
                    noResults={Labels.noResultsLabel} 
                    isNoResults={BooleanValues.isNoResults} 
                    isLoading={BooleanValues.isLoading}  
                />
                
        </div>
        
    )
}