import numpy as np
def compute_bias_gradient(y, y_hat):
    m = y.shape[0]
    bias_gradient = (np.mean(y_hat-y))
    return bias_gradient

if __name__ =="__main__":
    y = np.array([1, 0, 1, 0])
    y_hat = np.array([0.9, 0.1, 0.9, 0.1])

    print(compute_bias_gradient(y, y_hat))