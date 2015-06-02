var cats = {};

Leap.loop(function(frame) {


  frame.hands.forEach(function(hand, index) {
    
      console.log(hand);
    var cat = ( cats[index] || (cats[index] = new Cat()) );    
    cat.setTransform(hand.screenPosition(), hand.roll());
    
  });
  
}).use('screenPosition', {scale: 0.25});


var Cat = function() {
  var cat = this;
  var img = document.createElement('img');
  img.src = 'http://sccn.ucsd.edu/sloan-swartz-2007/images/dining.gif';
  img.style.position = 'absolute';
  img.onload = function () {
    cat.setTransform([window.innerWidth/2,window.innerHeight/2], 0);
    document.body.appendChild(img);
  }
  
  cat.setTransform = function(position, rotation) {

    // console.log(position);
    // console.log(rotation);

    img.style.left = position[0] - img.width  / 2 + 'px';
    img.style.top  = position[1] - img.height / 2 + 'px';

    img.style.transform = 'rotate(' + -rotation + 'rad)';
    
    img.style.webkitTransform = img.style.MozTransform = img.style.msTransform =
    img.style.OTransform = img.style.transform;

  };

};

cats[0] = new Cat();

// This allows us to move the cat even whilst in an iFrame.
Leap.loopController.setBackground(true)