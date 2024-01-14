// Example data for states and districts (replace it with your actual data)
const stateDistricts = {
    "Andhra Pradesh": ["District 1", "District 2", "District 3"],
    "Maharashtra": ["District A", "District B", "District C"],
    "Kerala":["Alappuzha",'Ernakulam','Idukki','Kannur','Kasaragod','Kollam','Kottayam','Kozhikode','Malappuram','Palakkad','Pathanamthitta','Thiruvananthapuram','Thrissur','Wayanad']
    // Add more states and districts as needed
  };

  // Function to populate the states dropdown
  function populateStates() {
    const stateDropdown = document.getElementById("state");
    for (const state in stateDistricts) {
      const option = document.createElement("option");
      option.value = state;
      option.text = state;
      stateDropdown.add(option);
    }
  }

  // Function to populate the districts dropdown based on the selected state
  function populateDistricts() {
    const stateDropdown = document.getElementById("state");
    const districtDropdown = document.getElementById("district");
    const selectedState = stateDropdown.value;

    // Clear existing options
    districtDropdown.innerHTML = '<option value="" disabled selected>Select District</option>';

    // Populate districts based on the selected state
    if (selectedState && stateDistricts[selectedState]) {
      for (const district of stateDistricts[selectedState]) {
        const option = document.createElement("option");
        option.value = district;
        option.text = district;
        districtDropdown.add(option);
      }
    }
  }

  // Function to validate input on blur
  function validateInput(input) {
    const errorMessageContainer = document.getElementById("errorMessages");
    errorMessageContainer.innerHTML = ''; // Clear existing error messages

    if (!input.checkValidity()) {
      input.classList.add("invalid-input");
      const errorId = input.id + "Error";
      const symbolId = input.id + "Symbol";
      displayErrorMessage(errorId, symbolId, getErrorMessage(input));
    } else {
      input.classList.remove("invalid-input");
      const errorId = input.id + "Error";
      const symbolId = input.id + "Symbol";
      hideErrorMessage(errorId, symbolId);
    }
  }

  // Function to display error messages
  function displayErrorMessage(errorId, symbolId, message) {
    const errorElement = document.getElementById(errorId);
    const symbolElement = document.getElementById(symbolId);
    errorElement.innerHTML = message;
    errorElement.style.display = 'block';
    symbolElement.style.display = 'block';
  }

  // Function to hide error messages
  function hideErrorMessage(errorId, symbolId) {
    const errorElement = document.getElementById(errorId);
    const symbolElement = document.getElementById(symbolId);
    errorElement.innerHTML = '';
    errorElement.style.display = 'none';
    symbolElement.style.display = 'none';
  }

  // Function to validate pin code on input
  function validatePinCode(pinCodeInput) {
    const errorMessageContainer = document.getElementById("errorMessages");
    errorMessageContainer.innerHTML = ''; // Clear existing error messages

    const pinCode = pinCodeInput.value;
    const isValid = /^[0-9]{6}$/.test(pinCode);

    if (!isValid) {
      pinCodeInput.classList.add("invalid-input");
      const errorId = pinCodeInput.id + "Error";
      const symbolId = pinCodeInput.id + "Symbol";
      displayErrorMessage(errorId, symbolId, "Please enter a valid 6-digit pin code.");
    } else {
      pinCodeInput.classList.remove("invalid-input");
      const errorId = pinCodeInput.id + "Error";
      const symbolId = pinCodeInput.id + "Symbol";
      hideErrorMessage(errorId, symbolId);
    }
  }

  // Function to validate mobile number on input
  function validateMobileNumber(mobileInput) {
    const errorMessageContainer = document.getElementById("errorMessages");
    errorMessageContainer.innerHTML = ''; // Clear existing error messages

    const mobileNumber = mobileInput.value;
    const isValid = /^[0-9]{10}$/.test(mobileNumber);

    if (!isValid) {
      mobileInput.classList.add("invalid-input");
      const errorId = mobileInput.id + "Error";
      const symbolId = mobileInput.id + "Symbol";
      displayErrorMessage(errorId, symbolId, "Please enter a valid 10-digit mobile number.");
    } else {
      mobileInput.classList.remove("invalid-input");
      const errorId = mobileInput.id + "Error";
      const symbolId = mobileInput.id + "Symbol";
      hideErrorMessage(errorId, symbolId);
    }
  }

  // Function to get error message based on input type
  function getErrorMessage(input) {
    switch (input.type) {
      case "text":
        return "Please fill out this field.";
      case "select-one":
        return "Please select an option.";
      case "tel":
        return "Please enter a valid 10-digit mobile number.";
      default:
        return "Please fill out this field.";
    }
  }

  // Event listener for form submission
  document.getElementById("deliveryForm").addEventListener("submit", function (event) {
    const form = event.target;
    if (!form.checkValidity()) {
      event.preventDefault();
      event.stopPropagation();
      displayErrorMessage("errorMessages", "", "Please fill out all required fields.");
    }

    // Add red border to invalid fields
    Array.from(form.elements).forEach((element) => {
      if (!element.checkValidity()) {
        element.classList.add("invalid-input");
        const errorId = element.id + "Error";
        const symbolId = element.id + "Symbol";
        displayErrorMessage(errorId, symbolId, getErrorMessage(element));
      } else {
        element.classList.remove("invalid-input");
        const errorId = element.id + "Error";
        const symbolId = element.id + "Symbol";
        hideErrorMessage(errorId, symbolId);
      }
    });

    form.classList.add("was-validated");
  });

  // Initialize the states dropdown on page load
  document.addEventListener("DOMContentLoaded", populateStates);


  $('#deliveryForm').submit((e) => {
    e.preventDefault()
    
    $.ajax({
      url: '/place-order',
      method: 'post',
      data: $('#deliveryForm').serialize(),
      success: (response) => {
        if (response.codSuccess) {
          location.href = '/order-success';
        } else {
          handleRazorpayResponse(response);
        }
      },
      error: (error) => {
        console.error('Error in AJAX request:', error);
        // Handle the error, e.g., show a message to the user
      }
    })
  })

  function handleRazorpayResponse(response) {
    var options = {
      "key": "rzp_test_v8bIpqXoTHrCgb",
      "amount": response.amount,
      "currency": "INR",
      "name": "Rax",
      "description": "Test Transaction",
      "image": "https://example.com/your_logo",
      "order_id": response.id,
      "handler": function (razorpayResponse) {
        // Handle the Razorpay response
     

        // Call the function to verify the payment
        verifyPayment(razorpayResponse, response);
      },
      "prefill": {
        "name": "Gaurav Kumar",
        "email": "gaurav.kumar@example.com",
        "contact": "9000090000"
      },
      "notes": {
        "address": "Razorpay Corporate Office"
      },
      "theme": {
        "color": "#3399cc"
      }
    };
    var rzp = new Razorpay(options);
    rzp.open();
  }

  function verifyPayment(payment, order) {
    $.ajax({
      url: '/verify-payment',
      data: {
        payment,
        order
      },
      method: 'post',
      success: (verificationResponse) => { 
        if(verificationResponse.status){
          location.href = '/order-success';
        }else{
          alert("Payment Failed")
        }
      },
      error: (error) => {
        console.error('Error in payment verification:', error);
        // Handle the error, e.g., show a message to the user
      }
    });
  }