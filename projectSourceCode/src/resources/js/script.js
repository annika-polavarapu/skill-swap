







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
    Location: ${eventDetails[0].location} <br>
    Event time: ${eventDetails[0].time} <br>
    Event modality: ${eventDetails[0].modality} <br>
    Event attendees: ${eventDetails[0].attendees} <br>
    Event name: ${eventDetails[0].name} <br>
    Event category: ${eventDetails[0].cat} <br>
`;}else{
    info.innerHTML = `
    url: ${eventDetails[0].url} <br>
    Event time: ${eventDetails[0].time} <br>
    Event modality: ${eventDetails[0].modality} <br>
    Event attendees: ${eventDetails[0].attendees} <br>
    Event name: ${eventDetails[0].name} <br>
    Event category: ${eventDetails[0].cat} <br>
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
