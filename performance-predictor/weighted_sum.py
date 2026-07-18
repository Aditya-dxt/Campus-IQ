import numpy as np

def compute_z(X, weights, bias):
    z = ((X@weights)+bias)
    return z
