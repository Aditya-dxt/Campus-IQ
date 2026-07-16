import numpy as np

def compute_z(X, weights, bias):
    z = ((X@weights)+bias)
    return z

if __name__ =="main":
    X = np.array([
    [0.4, 0.5, 0.3],
    [0.9, 0.8, 0.95]
    ])
    weights = np.array([1.0, 1.0, 1.0])
    bias = 0.0

    print(compute_z(X, weights, bias))