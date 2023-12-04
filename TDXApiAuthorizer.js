$(function () {
    GetAuthorizationHeader();
    AccessTrain(); 
    AccessMetro(); 
    AccessHSPR(); 
    AccessPark();
});

function GetAuthorizationHeader() {
    const parameter = {
        grant_type:"client_credentials",
        client_id: atob(atob(atob("WWtkc2RXVkhaSGxaV0d0M1QxUkZlRXhYVFhsYVJHZDRUMVJaZWt4VVNYbFpiVlYwVGtSVmVFMTNQVDA9"))),
        client_secret: atob(atob(atob("VG5wb2FrMXRXVFZPVkd0MFRtcFJNMDlETURCYVJHY3lURmRHYWsxdFNYUlBSRmsxV1dwSmVGbFhUVFZOVkVwcw==")))
    };
    let auth_url = "https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token";
  
    $.ajax({
        type: "POST",
        url: auth_url,
        crossDomain:true,
        dataType:'JSON',                
        data: parameter,
        async: false,       
        success: function(data){            
            $("#accesstoken").text(JSON.stringify(data));                           
        },
        error: function (xhr, textStatus, thrownError) {
            
        }
    });          
}

function GetAPIParsedData(api_url) {
    let accesstokenStr = $("#accesstoken").text();    
    let accesstoken = JSON.parse(accesstokenStr);
    let parseData = "";
    if(accesstoken !=undefined){
        $.ajax({
            type: 'GET',
            url: api_url,             
            headers: {
                "authorization": "Bearer " + accesstoken.access_token,                
              },            
            async: false,
            success: function (Data) {
                parseData = JSON.parse(JSON.stringify(Data));
            },
            error: function (xhr, textStatus, thrownError) {
                console.log('errorStatus:',textStatus);
                console.log('Error:',thrownError);
            }
        });
    }
    return parseData;
}

function getToday() {
    let yourDate = new Date();
    const offset = yourDate.getTimezoneOffset();
    yourDate = new Date(yourDate.getTime() - (offset*60*1000));
    document.getElementById("today").textContent = yourDate.toISOString().split('T')[0];
    return yourDate.toISOString().split('T')[0];
}

function isAvailableTime(stopTime, delay = 0) {
    const now = new Date();
    const cur_time = now.getHours() + ':' + now.getMinutes();
    var time1Date = new Date("01/01/2000 "+cur_time);
    var time2Date = new Date("01/01/2000 "+stopTime);
    if(delay > 0)
        time2Date = new Date(time2Date.getTime() + delay*60000);
    if(time1Date > time2Date) {
        return false;
    }
    return true;
}

function AccessMetro(){
    let accesstokenStr = $("#accesstoken").text();    

    let accesstoken = JSON.parse(accesstokenStr);    

    if(accesstoken !=undefined){
        let URL = 'https://tdx.transportdata.tw/api/basic/v2/Rail/Metro/S2STravelTime/TRTC?%24top=30&%24format=JSON';
        let trainData = GetAPIParsedData(URL);
        for(i = 0; i < trainData.length; ++i) {
            if(trainData[i].LineNo != 'R') {
                continue;
            }
            let travelTimes = trainData[i].TravelTimes;
            for(j = 0; j < trainData[i].TravelTimes.length; ++j) {
                //console.log('MRT', JSON.stringify(trainData[i].TravelTimes[j]));
                let FromStationName = trainData[i].TravelTimes[j].FromStationName.Zh_tw;
                let ToStationName = trainData[i].TravelTimes[j].ToStationName.Zh_tw;
                let zhongyi = '忠義';
                if( '忠義' != FromStationName && '忠義' != ToStationName) {
                    continue;
                }
            }
            
        }
        URL =  'https://tdx.transportdata.tw/api/basic/v2/Rail/Metro/StationTimeTable/TRTC?%24top=300000&%24format=JSON';
        let lineInfo = GetAPIParsedData(URL);
        //console.log('METTT', JSON.stringify(Data));
        for(i = 0; i < lineInfo.length; ++i) {
            if(lineInfo[i].LineID != 'R' || (lineInfo[i].StationName.Zh_tw != '淡水' && lineInfo[i].StationName.Zh_tw != '台北車站') || lineInfo[i].ServiceDay.ServiceTag != '平日')  {
                continue;
            }
            //console.log(lineInfo[i].StationName.Zh_tw);
            //console.log('METTT', JSON.stringify(lineInfo[i]));
            /*
            for(j = 0; j < lineInfo[i].Timetables.length && j < 30; ++j) {
                console.log('Metro R time', lineInfo[i].Timetables[j].DepartureTime);
            }
            */
        }
    }
}

function AccessTrain(){
    function TrainPrinter(train) {
        let trainInfo = train.TrainInfo; 
        let stopTime = train.StopTimes;
        let trainNo = trainInfo.TrainNo;
        let delayTime = 0;
        
        if(trainNo != undefined) {
            let URL = 'https://tdx.transportdata.tw/api/basic/v3/Rail/TRA/TrainLiveBoard/TrainNo/' + trainNo + '?%24top=1&%24format=JSON';
            let trainLiveBoards = GetAPIParsedData(URL).TrainLiveBoards[0];
            if(trainLiveBoards != undefined) {
                delayTime = trainLiveBoards.DelayTime;
            }
        }
        if(!isAvailableTime(stopTime[0].DepartureTime, delayTime)) {
           return undefined;
        }

        let lastStationIndex = stopTime.length-1;
        let info = "車次: " + trainInfo.TrainNo + "\t車種: " + trainInfo.TrainTypeName.Zh_tw + 
                   " \t\t["  + trainInfo.StartingStationName.Zh_tw + 
                   "->" + trainInfo.EndingStationName.Zh_tw +
                   "] " + stopTime[0].DepartureTime + " ~ " + 
                   stopTime[lastStationIndex].ArrivalTime; 
        if(delayTime > 0) 
            info = info + " 誤點: " + delayTime + "分";
        info = info + "\n";
        return info;
    }
    function TrainTimeTablePrinter(TrainTimetables) {
        let allTrains = "";
        let trainTimes = TrainTimetables;
        trainTimes.sort(function(a,b) {
            return a.StopTimes[0].DepartureTime.localeCompare(b.StopTimes[0].DepartureTime);
        });
            
        for(i = 0, count = 0; i < trainTimes.length && count < 5; ++i) {
            let stopTime = trainTimes[i].StopTimes;
            if(!isAvailableTime(stopTime[0].DepartureTime, 20)) {
                continue;
             }
            let info = TrainPrinter(trainTimes[i]);
            if(info != undefined) {
                allTrains = allTrains + info;
                ++count;
            }
        }
        return allTrains;
    }
    let URL = 'https://tdx.transportdata.tw/api/basic/v3/Rail/TRA/DailyTrainTimetable/OD/Inclusive/1000/to/1020/' + getToday() + '?%24top=10000&%24format=JSONStationOfLine';
    let trainData = GetAPIParsedData(URL);
    document.getElementById("taipei2banciaoTrain").textContent = TrainTimeTablePrinter(trainData.TrainTimetables);

    URL = 'https://tdx.transportdata.tw/api/basic/v3/Rail/TRA/DailyTrainTimetable/OD/Inclusive/1020/to/1000/' + getToday() + '?%24top=10000&%24format=JSONStationOfLine';
    trainData = GetAPIParsedData(URL);
    document.getElementById("banciao2taipeiTrain").textContent = TrainTimeTablePrinter(trainData.TrainTimetables);

    URL = 'https://tdx.transportdata.tw/api/basic/v3/Rail/TRA/StationLiveBoard/Station/1020?%24top=10000&%24format=JSON';
    trainData = GetAPIParsedData(URL);
    let liveBoard = trainData.StationLiveBoards;
    let allTrainInfo = "";
    for(i = 0; i < liveBoard.length; ++i) {
        let trainInfo = liveBoard[i].TrainTypeName.Zh_tw + " 往 " +  liveBoard[i].EndingStationName.Zh_tw + 
                        "(往" + ((liveBoard[i].Direction == 0) ? "北" : "南") + ") 抵達時間: " + 
                        liveBoard[i].ScheduleArrivalTime + "\n";
        allTrainInfo = allTrainInfo + trainInfo;
    }
    if(allTrainInfo === "") {
        allTrainInfo = "There is no Train now.";
    }
    document.getElementById("realTime").textContent = allTrainInfo;
}

function AccessHSPR(){
    function collectHSPRData(parsedData) {
        let hsprArray = [];
        let allHSPR = "";
        for(i = 0, count = 0; i < parsedData.length && count < 5; ++i) {
            if(!isAvailableTime(parsedData[i].OriginStopTime.DepartureTime)) {
                continue;
            }
            hsprArray.push({ no: parsedData[i].DailyTrainInfo.TrainNo, start: parsedData[i].DailyTrainInfo.StartingStationName.Zh_tw, 
                                end: parsedData[i].DailyTrainInfo.EndingStationName.Zh_tw, departureTime: parsedData[i].OriginStopTime.DepartureTime,
                                arrivalTime: parsedData[i].DestinationStopTime.ArrivalTime});
            ++count;
        }
        hsprArray.sort(function(a,b) {
            return a.departureTime.localeCompare(b.departureTime);
        });
        
        for(i = 0; i < hsprArray.length; ++i) {
            console.log('HSPR', hsprArray[i].no);    
            let info = "車次: " +  hsprArray[i].no + "\t[" + hsprArray[i].start + 
                        "->" + hsprArray[i].end + "] " + hsprArray[i].departureTime + 
                        " ~ " + hsprArray[i].arrivalTime + "\n";
            allHSPR = allHSPR + info;
        }
        return allHSPR;
    }
    
    let URL = 'https://tdx.transportdata.tw/api/basic/v2/Rail/THSR/DailyTimetable/OD/1010/to/1000/' + getToday() + '?%24top=100&%24format=JSON';
    let parsedData = GetAPIParsedData(URL);
    document.getElementById("banciao2taipeiHSPR").textContent = collectHSPRData(parsedData);

    URL = 'https://tdx.transportdata.tw/api/basic/v2/Rail/THSR/DailyTimetable/OD/1000/to/1010/' + getToday() + '?%24top=100&%24format=JSON';
    parsedData = GetAPIParsedData(URL);;
    document.getElementById("taipei2banciaoHSPR").textContent = collectHSPRData(parsedData);
}

function AccessPark(){
    let URL = 'https://tdx.transportdata.tw/api/basic/v1/Parking/OnStreet/ParkingSegmentAvailability/City/NewTaipei?%24top=100000&%24format=JSON';
    let parsedData = GetAPIParsedData(URL);
    let parkInfos = parsedData.CurbParkingSegmentAvailabilities;
    let parkArray = [];
    for(i = 0; i < parkInfos.length; ++i) {
        let addr = parkInfos[i].ParkingSegmentName.Zh_tw;
        if(!addr.includes("三峽")) {
            continue;
        }
        if(!addr.includes("中正") && !addr.includes("光明") && !addr.includes("大同") && !addr.includes("安溪") && !addr.includes("愛國")) {
            continue;
        }
        parkArray.push({address: addr, total: parkInfos[i].TotalSpaces, remain: parkInfos[i].AvailableSpaces});
    }
    parkArray.sort(function(a,b) {
        return a.address.localeCompare(b.address);
        //return b.remain - a.remain;
    });
    let sanxiaParks = "";
    for(i = 0 ; i < parkArray.length; ++i) {
        //console.log('park', parkArray[i].address, parkArray[i].total, parkArray[i].remain);
        sanxiaParks = sanxiaParks + "地點:" + parkArray[i].address + "\t剩餘: " + parkArray[i].remain + "\t總共: " + parkArray[i].total + "\n";
    }
    document.getElementById("sanxiaParks").textContent = sanxiaParks;
}


/*
Station information: https://tdx.transportdata.tw/api/basic/v3/Rail/TRA/StationOfLine
Trains arrive/departure information: https://tdx.transportdata.tw/api/basic/v3/Rail/TRA/StationLiveBoard/Station/{StationID}
Station ID: Taipei: 1000 Banciao: 1020
*/ 
