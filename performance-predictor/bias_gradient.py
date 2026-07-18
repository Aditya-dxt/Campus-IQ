import numpy as np
def compute_bias_gradient(y, y_hat):
    m = y.shape[0]
    bias_gradient = (np.mean(y_hat-y))
    return bias_gradient

