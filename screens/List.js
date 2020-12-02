import React, {useState, useEffect} from 'react';
import { useStateValue } from "../components/State";
import {View, Text, StyleSheet, ActivityIndicator, ScrollView} from 'react-native';
import { getStyles, Theme, getData } from '../utils';
import ListItem from "../components/ListItem";
import Map from "../components/Map";
import Search from "../components/Search";
import { findListings, fixSearch, searchSeries } from '../utils/helper';

function Page({ listings, navigation, viewMode, city, state }) {

    const [{ isWeb, dimensions, searchConfig }] = useStateValue();

    let staticCityState = '';
    if (city && state) {
        staticCityState = city + ', ' + state;
    }

    const [pageLoading, setPageLoading] = useState(isWeb ? false : true); // In web listings are pre-fetch by nextjs
    const [data, setData] = useState(listings || []); // This data is for all platforms to search to. In native listings is null
    const [filteredList, setFilteredList] = useState(listings);
    
    const updateData = async (arr) => {
        setPageLoading(true);
        console.log('isWEB')
        let toSearch = searchSeries(fixSearch(searchConfig.q));
        let newListings = findListings(arr, false, toSearch);

        if(searchConfig.near) { 
            try {
                const res = await fetch('https://spicygreenbook.org/api/geocode?query=' + searchConfig.near);
                const geo = await res.json();
                newListings = findListings(arr, geo.coords, toSearch);
            } catch (err) {
                console.error(err)
            }
        }   

        setFilteredList(newListings);
        setPageLoading(false);
    };

    // Check and initialized data for native platforms
    if (!listings) {
        useEffect(() => {
            getData({type: 'listing'}).then(_data => {
                setData(_data);
                updateData(_data);   
            }).catch(err => {
                console.error(err);
            });
        }, [])
    }

    // Search
    useEffect(() => {
        if(data.length === 0) return;

        updateData(data);
        setPageLoading(false);
    }, [searchConfig])

    return (
        <ScrollView>
        { pageLoading ?
            <View style={{marginTop: 200, marginBottom: 200}}>
                <ActivityIndicator size="large" />
            </View>
        : (
            <React.Fragment>
                <View style={{paddingTop: isWeb ? 120 : 0}} />
                <View key={'key' + '' + ''} style={[dimensions.width >= 800 ? {flexDirection: 'row'} : {}, isWeb && {borderTopWidth: 2, borderColor: Theme.green}]}>
                    <View style={dimensions.width >= 800 ? {flex: 1, borderRightWidth: 2, borderColor: Theme.green, minHeight: isWeb ? 'calc(100vh - 234px)' : 0} : {}}>
                        <View style={{ padding: 20, flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start'}}>
                            <Text style={[styles.text_header3, {marginBottom: 20}]}>
                                {filteredList.length === 1 ? '1 Black-Owned Business' : filteredList.length + ' Black-Owned Businesses'}
                            </Text>
                            {!viewMode && <Search mode="results" navigation={navigation} city={city} state={state}/> }
                        </View>
                        <View>
                            {filteredList.map((listing, n, ar) => <ListItem key={n} listing={listing} last={n===ar.length-1} navigation={navigation} viewMode={viewMode} />)}
                        </View>
                    </View>
                    {dimensions.width >= 800 &&
                        <View style={{flex: 1, position: 'relative'}}>  
                            <View style={[{position: 'fixed', zIndex: 1, top: 122, right: 0}, isWeb ? {width: 'calc(50% - 1px)', height: 'calc(100vh - 120px)'} : {}]}>
                                <Map list={filteredList} mode="d" />
                            </View> 
                        </View>
                    }
                </View>
            </React.Fragment>
        )}
        </ScrollView>
    )
}

const styles = StyleSheet.create(getStyles('text_header3, section, content'));

export default Page;