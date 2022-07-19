document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  document.querySelector('#compose-form').addEventListener('submit', send_email);

  function send_email(event) {
    event.preventDefault()
    const recipients = document.querySelector('#compose-recipients').value;
    const subject = document.querySelector('#compose-subject').value;
    const body = document.querySelector('#compose-body').value;
  
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: recipients,
          subject: subject,
          body: body
      })
    })
    .then(response => response.json())
    .then(result => {
        console.log(result);
        load_mailbox('sent');
    });
    return false;
    
  }

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#view-email').style.display = 'none';


  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}



function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#view-email').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      console.log(emails);
      emails.forEach(email => {

        const newemailDiv = document.createElement('div')
        newemailDiv.className = "mail";
        if (email.read) {
          newemailDiv.style.backgroundColor = 'grey';
        } else {
          newemailDiv.style.backgroundColor = 'white';
        }
        newemailDiv.innerHTML = `
        <span id="recipients">${email.sender}</span>
        <span id="subject">${email.subject}</span>
        <span id="timestamp">${email.timestamp}</span>
      `;
      document.querySelector('#emails-view').append(newemailDiv);
      newemailDiv.addEventListener('click', () => view_email(email['id']));
      
      })
  });

}


function view_email(email_id) {

  // Show the email view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#view-email').style.display = 'block';


  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
      console.log(email);

      // empty the view-email element before loading the email 
      document.querySelector('#view-email').innerHTML = "";

      // create the elements of an email
      const from = document.createElement('div');
      const to = document.createElement('div');
      const subject = document.createElement('div');
      const timestamp = document.createElement('div');
      const body = document.createElement('div');
      const archive_button = document.createElement('button');
      const unarchive_button = document.createElement('button');
      const reply_button = document.createElement('button');

      // add class name to elements
      archive_button.className = 'btn btn-outline-secondary';
      unarchive_button.className = 'btn btn-outline-secondary';
      reply_button.className = "btn btn-outline-primary";

      reply_button.style.marginRight = "7px";
      
      // elements inner HTML
      from.innerHTML = `<strong>From: </strong>${email.sender}`;
      to.innerHTML = `<strong>To: </strong>${email.recipients}`;
      subject.innerHTML = `<strong>Subject: </strong>${email.subject}`;
      timestamp.innerHTML = `<strong>Timestamp: </strong>${email.timestamp}`;
      body.innerHTML = email.body;
      reply_button.innerHTML = "Reply";
      archive_button.innerHTML = "Archive";
      unarchive_button.innerHTML = "Unarchive";
      
      // append elements to DOM
      document.querySelector('#view-email').append(from,to,subject,timestamp,body,reply_button);
      

      // check if email is archived or not
      if (email.archived) {
        document.querySelector('#view-email').append(unarchive_button);
        unarchive_button.addEventListener('click', () => archive_email(email,email['id']));
        unarchive_button.addEventListener('click', () => load_mailbox('inbox'));
      } else {
        document.querySelector('#view-email').append(archive_button);
        archive_button.addEventListener('click', () => archive_email(email,email['id']));
        archive_button.addEventListener('click', () => load_mailbox('inbox'));
      }

      document.querySelector('#view-email').append(document.createElement('hr'));
      // when click on reply button take user to compose_email
      reply_button.addEventListener('click', function() {
        compose_email();

        // Pre-fill the composition form  
        document.querySelector('#compose-recipients').value = email.sender;
        document.querySelector('#compose-subject').value = `Re: ${email.subject}` ;

        // Check if subject line already begins with Re:
        const str = email.subject
        if (str.slice(0, 3) === 'Re:') {
          document.querySelector('#compose-subject').value = email.subject ;
          document.querySelector('#compose-body').value = `On ${email.timestamp} wrote: ${str.substr(3)}`;

        } else {
          document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
          document.querySelector('#compose-body').value = `On ${email.timestamp} wrote: ${email.subject}`;
        }

  });

  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  })
})
}

function archive_email(email,email_id) {
  if (!email.archived) {

    fetch(`/emails/${email_id}`, {
      method: 'PUT',
      body: JSON.stringify({
          archived: true
      })
    })
  } else {

    fetch(`/emails/${email_id}`, {
      method: 'PUT',
      body: JSON.stringify({
          archived: false
      })
    })
  }
}