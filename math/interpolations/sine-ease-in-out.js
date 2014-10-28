// Modeled after half sine wave
function sineEaseInOut (p) {
    return 0.5 * ( 1 - Math.cos( p * Math.PI ) );
}