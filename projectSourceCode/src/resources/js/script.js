



let currentoffset=0;

 

function ww() {

    const now = new Date();

const formattedDate = `${now.getMonth() + 1}-${now.getDate()}-${now.getFullYear()}`;

document.getElementById("currentdate").innerHTML = formattedDate;

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const dayName = days[now.getDay()]; // Get the day of the week
console.log(dayName)


populatedays(0)

}


function populatedaysandevents(){

    //populate days
    ww();
    //populate events
    appendschedule();

}

function geteventsfromdb() {
    

        window.location.href = '/findevents';
 

  
  }

  
function initialsetup(){

    //this function should be run once on the page when first loaded,
    //it populates the weeks with dates and then it
    //gets the current events in the database.
    //database events must be updated only when the schedule event button is pressed
    //afterwards.


   

    geteventsfromdb();

    ww();



}


function returnoffsetdate(){

        
       const now = new Date();

       const nowt=now.getTime();

        const shift= new Date(nowt+(currentoffset*86400000));

        const ttshift=shift.getTime();

      

        return shift;

}



function nextweek(){
    currentoffset=currentoffset+7;
    ww();
    clearprevdates()
       clearevents()
    appendschedule();

}

function prevweek(){
    currentoffset=currentoffset-7;
    ww();
    clearprevdates()
       clearevents()
    appendschedule()
    
}




function nextday(){
    currentoffset++;
    ww();
    clearprevdates()
    clearprevevents()

}

function prevday(){
    currentoffset--;
    ww();
    clearprevdates()
    clearevents()
    
}



function clearprevdates(){

  for (let i = 0; i < 7; i++) {
const element = document.getElementsByClassName("formdate")[i];
element.remove(); // Removes the div with the 'div-02' id
  }


}



function checkifdatepresent(targetdate,nameofevent,eventloc,evtime,atten,moda){


          const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
             

          console.log("TARGET DATE")
          console.log(targetdate)

          const now = new Date(targetdate);
          const nowt=now.getDay();

          console.log("DAY INDEX")
          console.log(nowt)

          const currentday=daysOfWeek[nowt];
          console.log("CURRENT DAY!")
          console.log(currentday)


          console.log("NEWTEST")
          const element = document.getElementsByName(targetdate);
          console.log(element);
         
          element.forEach(el => 
            manualsaveevent(nameofevent, currentday, evtime , moda ,eventloc,'name',atten)
            );




}




function clearevents(){



let elements = document.querySelectorAll(".event.row.border.rounded.m-1.py-1");

// Loop through each element and apply a change
elements.forEach(element => {
    element.remove();
    console.log("elements")
    console.log(elements)
});



}



 

function selectday(dayindex){


const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

var currentdate = document.getElementById(days[dayindex])
console.log(currentdate)


return currentdate;

}





function populatedays(offset){


    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

    


    const now =  returnoffsetdate()
    const nowt=now.getTime();
    const dayindex= now.getDay()+offset;




    console.log(nowt)

     for (let i = 0; i < dayindex; i++) {

    
    var tempdate=nowt-(86400000*(i+1))

  
    var ttnow = new Date(tempdate);


    var formattedDate = `${ttnow.getMonth() + 1}-${ttnow.getDate()}-${ttnow.getFullYear()}`;


  
     console.log("FORMATTED DATE")
     console.log(formattedDate)

    let daychild=document.createElement('div');
    daychild.innerHTML=` 
    <p class="formdate h6 text-center position-relative py-2 day", name="${formattedDate}">${formattedDate}</p>
    `



    var selectedday=document.getElementById(days[dayindex-(i+1)]);
    console.log(selectedday);

 

    selectedday.appendChild(daychild)



    }

    console.log("SECOND HALF!!!")

        var counter=0;
        for (let i = dayindex; i < 7; i++) {
            console.log(i)
            
            var tempdate=nowt+(86400000*counter)
            var ttnow = new Date(tempdate);

             var formattedDate = `${ttnow.getMonth() + 1}-${ttnow.getDate()}-${ttnow.getFullYear()}`;


        
            console.log("FORMATTED DATE")
            console.log(formattedDate)

        

             var selectedday=document.getElementById(days[i]);
    console.log(selectedday);

     let daychild=document.createElement('div');
              daychild.innerHTML=` 
            <p class="formdate h6 text-center position-relative py-2 day", name="${formattedDate}">${formattedDate}</p>
            `

        
   selectedday.appendChild(daychild)


 
console.log(selectedday);

   

             counter=counter+1;   
        }



   

}










function saveEvent() {
    
    const element = document.getElementById('evname');
    console.log(element.value)
    
    
    const eventName = document.getElementById('evname')?.value || '';
    const eventDate = document.getElementById('event_weekday')?.value || '';
    const eventtime = document.getElementById('event_time')?.value || '';
    const eventmodality = document.getElementById('event_modality')?.value || '';
    const eventlocation = document.getElementById('location')?.value || '';
    const eventurl=document.getElementById('remotename')?.value || '';
    const eventattendees = document.getElementById('attendees')?.value || '';
    const categorization = document.getElementById('category')?.value || '';
    const events = [
        { name: eventName, date: eventDate, location: eventlocation, time:eventtime, modality:eventmodality, attendees: eventattendees , url:eventurl, cat:categorization}
      ];
      console.log(events);
      /*
      document.getElementById('evname').value = '';
      document.getElementById('event_weekday').value = '';
      document.getElementById('event_time').value = '';
      document.getElementById('event_modality').value = '';
      //document.getElementById('location').value = '';
      document.getElementById('attendees').value = '';
      //document.getElementById('url').value = '';
      //document.getElementById('category').value = '';
      */

      addEventToCalendarUI(events);
    
    }


function manualsaveevent(peventname, peventweekday, peventtime, peventmodality,plocation,premotename,pattendees){


    const eventName = peventname || '';
    const eventDate = peventweekday || '';
    const eventtime = peventtime || '';
    const eventmodality = peventmodality || '';
    const eventlocation = plocation || '';
    const eventurl=premotename || '';
    const eventattendees = pattendees || '';
   
    const events = [
        { name: eventName, date: eventDate, location: eventlocation, time:eventtime, modality:eventmodality, attendees: eventattendees , url:eventurl}
      ];
      console.log(events);

      addEventToCalendarUI(events);


}


function addEventToCalendarUI(events){

    let event_card = createEventCard(events);
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    document.getElementById('sunday').appendChild(event_card);
    
    console.log("START");
    console.log(events[0].date);
    
    for (let i = 0; i < daysOfWeek.length; i++) {
        console.log(i);
        console.log(daysOfWeek[i]);
        
        if (events[0].date===daysOfWeek[i]) {
            console.log("day l");
            document.getElementById(daysOfWeek[i]).appendChild(event_card);
        

            // console.log(`Day located: ${daysOfWeek[i]}`);
        //     document.getElementById(daysOfWeek[i]).appendChild(eventCard);
        //     return; // Stop the loop once the correct day is found
        // }
        }

    }

    
}





function createEventCard(eventDetails) {


    let event_element = document.createElement('div');
    
    event_element.classList = 'event row border rounded m-1 py-1';
    let info=document.createElement('div');
    
    


    if(modality=="remote"){
    info.innerHTML = `
    <b>Location:</b> ${eventDetails[0].location} <br>
    <b> Event time:</b> ${eventDetails[0].time}  <br>
    <b>Event modality:</b> ${eventDetails[0].modality} <br>
    <b>Event attendees:</b> ${eventDetails[0].attendees} <br>
    <b>Event name:</b> ${eventDetails[0].name} <br>
    
`;}else{
    
    info.innerHTML = `
    <b>url:</b> ${eventDetails[0].url} <br>
    <b>Event time: </b>${eventDetails[0].time} <br>
    <b>Event modality: </b>${eventDetails[0].modality}<br>
    <b>Event attendees: </b>${eventDetails[0].attendees} <br>
    <b>Event name: </b>${eventDetails[0].name}<br>

`;
}
const colorarray = ['green','red','yellow','blue'];

var catindex=returncatindex(eventDetails);
console.log("selected color:");
console.log(colorarray[catindex]);

info.style.backgroundColor=colorarray[catindex];





    event_element.appendChild(info);
    return event_element;
}





function returncatindex(eventDetails){
    const colorarray = ["academic","personal","fitness","social"];
    for (let i = 0; i < colorarray.length; i++) {
    
        if(eventDetails[0].cat==colorarray[i]){
            console.log("catindexfound!");
            console.log(i)
            return(i)
        }
}
}



let modality="remote";

function updateLocationOptions(){



    console.log("PREVIOUS VALUE")
    console.log(modality);
    console.log("NEW VALUE")
    if(modality=="in-person"){
        modality="remote"
       //console.log("wasinperson");
    }else{
        modality="in-person"
        //console.log("wasremote");
    }


    console.log(modality);



    
    if(modality=="in-person"){
    let form=document.createElement('form');
    form.id="remoteurl"

    
    const label = document.createElement('label');
    label.for = 'remote-url';
    label.textContent = 'Enter Remote URL:';
    label.classList = 'block text-gray-700 mb-2';
  
    const input = document.createElement('input');
    input.type = 'url';
    input.id = 'remotename';
    input.name = 'remotename';
    input.placeholder = 'https://example.com';
    input.classList = 'block w-full px-3 py-2 border rounded mb-3';


    form.appendChild(label);
    form.appendChild(input);
    //form.appendChild(submitButton);
    //document.body.appendChild(form);


    var prevlocation = document.getElementById('location');
    prevlocation.replaceWith(form)


    }else{
        let form=document.createElement('form');
        form.id="location"
    
    
        
        const label = document.createElement('label');
        label.for = 'location';
        label.textContent = 'Enter location:';
        label.classList = 'block text-gray-700 mb-2';
    
      
        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'location';
        input.name = 'locname';
        input.placeholder = 'enter location';
        input.classList = 'block w-full px-3 py-2 border rounded mb-3';
    
    


    
        form.appendChild(label);
        form.appendChild(input);
        //form.appendChild(submitButton);





        
        var prevlocation = document.getElementById('remoteurl');
        prevlocation.replaceWith(form)







    }
















    //document.getElementById('sunday').appendChild(form);
}



function reportvalue(){
    console.log("BUTTON PRESS!");
    const eventName = document.getElementById('remotesubmit')?.value || '';
   // console.log(eventname);

}




    async function getQuote() {
        const res = await fetch("https://zenquotes.io/api/random");
        const data = await res.json();
        console.log(data);

        const proxyUrl = "https://api.allorigins.win/get?url=";
const targetUrl = "https://zenquotes.io/api/random";

fetch(proxyUrl + encodeURIComponent(targetUrl))
  .then(response => response.json())
  .then(data => {
    const quoteData = JSON.parse(data.contents);
    console.log(quoteData[0].q, "—", quoteData[0].a);
  });
    }