import numpy as np
def update_weights(weights, gradient, alpha):
    new_weights = (weights -(alpha*gradient))
    return new_weights

